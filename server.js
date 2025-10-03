require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 1800 }); // 30 min cache
let cardsMetadata = {}; // Global cards metadata cache

// CORS - update with your GitHub Pages URL in production
app.use(cors({
  origin: '*', // For testing. Replace with 'https://YOUR_GITHUB_USERNAME.github.io' in production
  methods: ['GET'],
  credentials: false
}));

app.use(express.json());

// Initialize cards metadata on startup
async function initializeCardsMetadata() {
  try {
    console.log('Fetching cards metadata...');
    const token = process.env.CLASH_API_TOKEN;
    const response = await axios.get('https://api.clashroyale.com/v1/cards', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    // Build lookup object by card name
    response.data.items.forEach(card => {
      cardsMetadata[card.name] = {
        id: card.id,
        name: card.name,
        iconUrl: card.iconUrls?.medium || card.iconUrls?.small || '',
        elixirCost: card.elixirCost,
        rarity: card.rarity,
        maxLevel: card.maxLevel,
        maxEvolutionLevel: card.maxEvolutionLevel || 0
      };
    });

    console.log(`Loaded ${Object.keys(cardsMetadata).length} cards metadata`);
  } catch (error) {
    console.error('Failed to load cards metadata:', error.message);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cardsLoaded: Object.keys(cardsMetadata).length
  });
});

// Get all cards metadata
app.get('/api/cards', (req, res) => {
  res.json({
    cards: Object.values(cardsMetadata),
    total: Object.keys(cardsMetadata).length
  });
});

// Get player profile
app.get('/api/player/:tag', async (req, res) => {
  try {
    const cleanTag = req.params.tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;

    // Check cache
    const cacheKey = `player_${cleanTag}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const player = await fetchPlayerProfile(fullTag);

    // Cache for 30 minutes
    cache.set(cacheKey, player);

    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced card counts endpoint
app.get('/api/cardcounts', async (req, res) => {
  try {
    const { tag, types, timeRange } = req.query;

    if (!tag) {
      return res.status(400).json({ error: 'Player tag is required' });
    }

    // Clean tag
    const cleanTag = tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;

    // Build cache key with filters
    const cacheKey = `cardcounts_${cleanTag}_${types || 'all'}_${timeRange || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${fullTag}`);
      return res.json(cached);
    }

    // Fetch data in parallel
    const [battleLog, playerProfile] = await Promise.all([
      fetchBattleLog(fullTag),
      fetchPlayerProfile(fullTag).catch(() => null) // Don't fail if player fetch fails
    ]);

    if (!battleLog || battleLog.length === 0) {
      return res.json({
        player: playerProfile,
        analysis: {
          totalBattles: 0,
          processedBattles: 0,
          battleTypes: {},
          dateRange: null
        },
        cards: [],
        message: 'No battles found'
      });
    }

    // Process battles with filters
    const result = processBattles(battleLog, fullTag, {
      types: types ? types.split(',') : null,
      timeRange: timeRange
    });

    // Add player profile
    result.player = playerProfile;

    // Cache result
    cache.set(cacheKey, result);

    res.json(result);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: error.message,
      playerTag: req.query.tag
    });
  }
});

// Fetch battle log from Clash Royale API
async function fetchBattleLog(playerTag) {
  const token = process.env.CLASH_API_TOKEN;

  if (!token) {
    throw new Error('CLASH_API_TOKEN not configured in .env file');
  }

  const encodedTag = encodeURIComponent(playerTag);
  const url = `https://api.clashroyale.com/v1/players/${encodedTag}/battlelog`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log(`Fetched ${response.data.length} battles for ${playerTag}`);
    return response.data;

  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorMap = {
        400: 'Invalid player tag format',
        403: 'API authentication failed - check token and IP whitelist',
        404: 'Player not found',
        429: 'Rate limit exceeded - try again later',
        503: 'Clash Royale API temporarily unavailable'
      };
      throw new Error(errorMap[status] || `API Error: ${status}`);
    }
    throw error;
  }
}

// Fetch player profile
async function fetchPlayerProfile(playerTag) {
  const token = process.env.CLASH_API_TOKEN;
  const encodedTag = encodeURIComponent(playerTag);
  const url = `https://api.clashroyale.com/v1/players/${encodedTag}`;

  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const player = response.data;

  return {
    name: player.name,
    tag: player.tag,
    level: player.expLevel,
    trophies: player.trophies,
    bestTrophies: player.bestTrophies,
    wins: player.wins,
    losses: player.losses,
    winRate: player.wins / (player.wins + player.losses),
    battleCount: player.battleCount,
    threeCrownWins: player.threeCrownWins,
    arena: {
      name: player.arena?.name,
      id: player.arena?.id,
      iconUrl: player.arena?.iconUrls?.small || ''
    },
    clan: player.clan ? {
      name: player.clan.name,
      tag: player.clan.tag,
      badgeId: player.clan.badgeId
    } : null,
    currentPathOfLegend: player.currentPathOfLegendSeasonResult || null,
    lastSeen: new Date().toISOString()
  };
}

// Process battles with enhanced statistics
function processBattles(battleLog, playerTag, filters = {}) {
  const cardStats = {}; // { cardName: { count, wins, losses, levels: [] } }
  const battleTypeCounts = {};
  let totalBattles = 0;
  let processedBattles = 0;
  let oldestBattle = null;
  let newestBattle = null;

  // Time range filtering
  const now = Date.now();
  const timeRangeMs = getTimeRangeMs(filters.timeRange);

  for (const battle of battleLog) {
    const battleTime = new Date(battle.battleTime).getTime();

    // Apply time range filter
    if (timeRangeMs && (now - battleTime) > timeRangeMs) {
      continue;
    }

    // Track date range
    if (!oldestBattle || battleTime < new Date(oldestBattle).getTime()) {
      oldestBattle = battle.battleTime;
    }
    if (!newestBattle || battleTime > new Date(newestBattle).getTime()) {
      newestBattle = battle.battleTime;
    }

    // Filter for competitive battle types
    const competitiveTypes = ['PVP', 'CASUAL_1V1', 'PATH_OF_LEGEND', 'TOURNAMENT'];

    // Apply battle type filter
    if (filters.types && !filters.types.includes(battle.type)) {
      continue;
    }

    if (competitiveTypes.includes(battle.type)) {
      totalBattles++;
      battleTypeCounts[battle.type] = (battleTypeCounts[battle.type] || 0) + 1;

      const opponentDeck = getOpponentDeck(battle, playerTag);
      const playerWon = getPlayerWonStatus(battle, playerTag);

      if (opponentDeck && opponentDeck.length > 0) {
        processedBattles++;

        // Track each opponent card
        for (const card of opponentDeck) {
          const cardName = card.name;

          if (!cardStats[cardName]) {
            cardStats[cardName] = {
              count: 0,
              wins: 0,
              losses: 0,
              levels: []
            };
          }

          cardStats[cardName].count++;
          cardStats[cardName].levels.push(card.level);

          if (playerWon !== null) {
            if (playerWon) {
              cardStats[cardName].wins++;
            } else {
              cardStats[cardName].losses++;
            }
          }
        }
      }
    }
  }

  // Build enhanced card data
  const cards = Object.entries(cardStats)
    .map(([name, stats]) => {
      const metadata = cardsMetadata[name] || {};
      const totalMatches = stats.wins + stats.losses;
      const avgLevel = stats.levels.length > 0
        ? stats.levels.reduce((a, b) => a + b, 0) / stats.levels.length
        : 0;

      return {
        name,
        count: stats.count,
        percentage: totalBattles > 0 ? stats.count / totalBattles : 0,
        wins: stats.wins,
        losses: stats.losses,
        winRate: totalMatches > 0 ? stats.wins / totalMatches : null,
        metadata: {
          iconUrl: metadata.iconUrl || '',
          elixirCost: metadata.elixirCost || 0,
          rarity: metadata.rarity || 'COMMON',
          maxLevel: metadata.maxLevel || 14
        },
        opponentStats: {
          avgLevel: Math.round(avgLevel * 10) / 10,
          maxLevel: Math.max(...stats.levels, 0),
          minLevel: Math.min(...stats.levels, 14),
          levelDistribution: stats.levels
        }
      };
    })
    .sort((a, b) => b.count - a.count);

  // Calculate average opponent deck stats
  const allLevels = cards.flatMap(c => c.opponentStats.levelDistribution);
  const allElixir = cards
    .filter(c => c.metadata.elixirCost > 0)
    .flatMap(c => Array(c.count).fill(c.metadata.elixirCost));

  return {
    analysis: {
      totalBattles,
      processedBattles,
      battleTypes: battleTypeCounts,
      dateRange: oldestBattle && newestBattle ? {
        from: oldestBattle,
        to: newestBattle,
        daysSpan: Math.ceil((new Date(newestBattle) - new Date(oldestBattle)) / (1000 * 60 * 60 * 24))
      } : null,
      avgOpponentCardLevel: allLevels.length > 0
        ? Math.round((allLevels.reduce((a, b) => a + b, 0) / allLevels.length) * 10) / 10
        : 0,
      avgOpponentElixirCost: allElixir.length > 0
        ? Math.round((allElixir.reduce((a, b) => a + b, 0) / allElixir.length) * 10) / 10
        : 0
    },
    cards,
    filters: {
      types: filters.types || ['all'],
      timeRange: filters.timeRange || 'all'
    },
    meta: {
      cached: false,
      lastUpdated: new Date().toISOString(),
      cacheExpires: new Date(Date.now() + 1800000).toISOString()
    }
  };
}

// Get opponent deck from battle
function getOpponentDeck(battle, playerTag) {
  try {
    // Standard 1v1 battle
    if (battle.team && battle.opponent) {
      return battle.opponent[0].cards;
    }

    // Team battles
    if (battle.teams && battle.teams.length >= 2) {
      for (const team of battle.teams) {
        const isPlayerTeam = team.some(player => player.tag === playerTag);

        if (!isPlayerTeam && team.length > 0) {
          return team[0].cards;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting opponent deck:', error);
    return null;
  }
}

// Determine if player won the battle
function getPlayerWonStatus(battle, playerTag) {
  try {
    // Check trophyChange for the player
    if (battle.team && Array.isArray(battle.team)) {
      const playerData = battle.team.find(p => p.tag === playerTag);
      if (playerData && playerData.trophyChange !== undefined) {
        return playerData.trophyChange > 0;
      }
    }

    // Fallback: check crowns
    if (battle.team && battle.opponent) {
      const playerCrowns = battle.team[0]?.crowns || 0;
      const opponentCrowns = battle.opponent[0]?.crowns || 0;
      if (playerCrowns !== opponentCrowns) {
        return playerCrowns > opponentCrowns;
      }
    }

    return null; // Can't determine
  } catch (error) {
    return null;
  }
}

// Convert time range string to milliseconds
function getTimeRangeMs(timeRange) {
  if (!timeRange) return null;

  const ranges = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '14d': 14 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  return ranges[timeRange] || null;
}

const PORT = process.env.PORT || 3000;

// Initialize and start server
(async () => {
  await initializeCardsMetadata();

  app.listen(PORT, () => {
    console.log(`Clash Card Counter API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Player profile: http://localhost:${PORT}/api/player/TAG`);
    console.log(`Card counts: http://localhost:${PORT}/api/cardcounts?tag=TAG`);
    console.log(`Enhanced: http://localhost:${PORT}/api/cardcounts?tag=TAG&types=PVP,PATH_OF_LEGEND&timeRange=7d`);
  });
})();
