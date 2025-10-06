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

// Get specific deck details
app.get('/api/deck/:deckId', async (req, res) => {
  try {
    const { tag } = req.query;
    const { deckId } = req.params;

    if (!tag) {
      return res.status(400).json({ error: 'Player tag is required' });
    }

    const cleanTag = tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;

    // Check cache
    const cacheKey = `cardcounts_${cleanTag}`;
    let result = cache.get(cacheKey);

    if (!result) {
      const battleLog = await fetchBattleLog(fullTag);
      result = processBattles(battleLog, fullTag);
      cache.set(cacheKey, result);
    }

    // Find the specific deck
    const deck = result.decks.find(d => d.deckId === decodeURIComponent(deckId));

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json({
      deck,
      player: {
        tag: fullTag
      }
    });

  } catch (error) {
    console.error('Error fetching deck details:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Compare multiple decks
app.get('/api/decks/compare', async (req, res) => {
  try {
    const { tag, deckIds } = req.query;

    if (!tag) {
      return res.status(400).json({ error: 'Player tag is required' });
    }

    if (!deckIds) {
      return res.status(400).json({ error: 'Deck IDs are required (comma-separated)' });
    }

    const cleanTag = tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;

    // Check cache
    const cacheKey = `cardcounts_${cleanTag}`;
    let result = cache.get(cacheKey);

    if (!result) {
      const battleLog = await fetchBattleLog(fullTag);
      result = processBattles(battleLog, fullTag);
      cache.set(cacheKey, result);
    }

    const deckIdList = deckIds.split(',').map(id => decodeURIComponent(id.trim()));
    const decks = result.decks.filter(d => deckIdList.includes(d.deckId));

    if (decks.length === 0) {
      return res.status(404).json({ error: 'No matching decks found' });
    }

    // Calculate comparison metrics
    const comparison = {
      decks,
      summary: {
        totalBattles: decks.reduce((sum, d) => sum + d.battles, 0),
        avgWinRate: decks.reduce((sum, d) => sum + d.winRate, 0) / decks.length,
        bestDeck: decks.reduce((best, d) => d.winRate > best.winRate ? d : best, decks[0]),
        mostPlayed: decks.reduce((most, d) => d.battles > most.battles ? d : most, decks[0])
      }
    };

    res.json(comparison);

  } catch (error) {
    console.error('Error comparing decks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============= CLAN ENDPOINTS =============

// Get clan information
app.get('/api/clan/:tag', async (req, res) => {
  try {
    const cleanTag = req.params.tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;

    // Check cache
    const cacheKey = `clan_${cleanTag}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const clan = await fetchClan(fullTag);
    cache.set(cacheKey, clan, 3600); // 1 hour cache

    res.json(clan);
  } catch (error) {
    console.error('Error fetching clan:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get clan members with activity analysis
app.get('/api/clan/:tag/members', async (req, res) => {
  try {
    const cleanTag = req.params.tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;
    const { sortBy = 'trophies', order = 'desc' } = req.query;

    // Check cache
    const cacheKey = `clan_members_${cleanTag}_${sortBy}_${order}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const clan = await fetchClan(fullTag);

    // Sort members
    const members = sortMembers(clan.memberList, sortBy, order);

    const result = {
      clanTag: fullTag,
      clanName: clan.name,
      memberCount: clan.members,
      members
    };

    cache.set(cacheKey, result, 1800); // 30 min cache

    res.json(result);
  } catch (error) {
    console.error('Error fetching clan members:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get current River Race
app.get('/api/clan/:tag/riverrace/current', async (req, res) => {
  try {
    const cleanTag = req.params.tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;

    // Check cache (shorter TTL for active wars)
    const cacheKey = `clan_riverrace_${cleanTag}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const riverRace = await fetchCurrentRiverRace(fullTag);
    cache.set(cacheKey, riverRace, 300); // 5 min cache during war

    res.json(riverRace);
  } catch (error) {
    console.error('Error fetching river race:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get River Race log
app.get('/api/clan/:tag/riverrace/log', async (req, res) => {
  try {
    const cleanTag = req.params.tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;
    const { limit = 10 } = req.query;

    // Check cache
    const cacheKey = `clan_riverrace_log_${cleanTag}_${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const riverRaceLog = await fetchRiverRaceLog(fullTag);
    cache.set(cacheKey, riverRaceLog, 21600); // 6 hour cache

    res.json(riverRaceLog);
  } catch (error) {
    console.error('Error fetching river race log:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get clan analytics
app.get('/api/clan/:tag/analytics', async (req, res) => {
  try {
    const cleanTag = req.params.tag.replace('#', '').toUpperCase();
    const fullTag = '#' + cleanTag;

    // Fetch all data in parallel
    const [clan, riverRace, riverRaceLog] = await Promise.all([
      fetchClan(fullTag),
      fetchCurrentRiverRace(fullTag).catch(() => null),
      fetchRiverRaceLog(fullTag).catch(() => null)
    ]);

    const analytics = calculateClanAnalytics(clan, riverRace, riverRaceLog);

    res.json(analytics);
  } catch (error) {
    console.error('Error calculating clan analytics:', error.message);
    res.status(500).json({ error: error.message });
  }
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

// Fetch clan information
async function fetchClan(clanTag) {
  const token = process.env.CLASH_API_TOKEN;
  const encodedTag = encodeURIComponent(clanTag);
  const url = `https://api.clashroyale.com/v1/clans/${encodedTag}`;

  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  return response.data;
}

// Fetch current River Race
async function fetchCurrentRiverRace(clanTag) {
  const token = process.env.CLASH_API_TOKEN;
  const encodedTag = encodeURIComponent(clanTag);
  const url = `https://api.clashroyale.com/v1/clans/${encodedTag}/currentriverrace`;

  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  return response.data;
}

// Fetch River Race log
async function fetchRiverRaceLog(clanTag) {
  const token = process.env.CLASH_API_TOKEN;
  const encodedTag = encodeURIComponent(clanTag);
  const url = `https://api.clashroyale.com/v1/clans/${encodedTag}/riverracelog`;

  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  return response.data;
}

// Sort clan members
function sortMembers(members, sortBy, order) {
  const sorted = [...members].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'trophies':
        aVal = a.trophies;
        bVal = b.trophies;
        break;
      case 'donations':
        aVal = a.donations;
        bVal = b.donations;
        break;
      case 'donationsReceived':
        aVal = a.donationsReceived;
        bVal = b.donationsReceived;
        break;
      case 'clanRank':
        aVal = a.clanRank;
        bVal = b.clanRank;
        break;
      default:
        aVal = a.trophies;
        bVal = b.trophies;
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

// Calculate clan analytics
function calculateClanAnalytics(clan, riverRace, riverRaceLog) {
  const analytics = {
    clan: {
      tag: clan.tag,
      name: clan.name,
      description: clan.description,
      type: clan.type,
      badgeId: clan.badgeId,
      clanScore: clan.clanScore,
      clanWarTrophies: clan.clanWarTrophies,
      requiredTrophies: clan.requiredTrophies,
      members: clan.members,
      location: clan.location
    },
    summary: {
      totalMembers: clan.members,
      avgTrophies: 0,
      totalDonations: 0,
      totalDonationsReceived: 0,
      avgDonations: 0,
      leaderCount: 0,
      coLeaderCount: 0,
      elderCount: 0,
      memberCount: 0
    },
    currentWar: null,
    warHistory: []
  };

  // Calculate member statistics
  if (clan.memberList && clan.memberList.length > 0) {
    const totalTrophies = clan.memberList.reduce((sum, m) => sum + m.trophies, 0);
    const totalDonations = clan.memberList.reduce((sum, m) => sum + m.donations, 0);
    const totalReceived = clan.memberList.reduce((sum, m) => sum + m.donationsReceived, 0);

    analytics.summary.avgTrophies = Math.round(totalTrophies / clan.memberList.length);
    analytics.summary.totalDonations = totalDonations;
    analytics.summary.totalDonationsReceived = totalReceived;
    analytics.summary.avgDonations = Math.round(totalDonations / clan.memberList.length);

    // Count roles
    clan.memberList.forEach(member => {
      switch (member.role) {
        case 'leader': analytics.summary.leaderCount++; break;
        case 'coLeader': analytics.summary.coLeaderCount++; break;
        case 'elder': analytics.summary.elderCount++; break;
        case 'member': analytics.summary.memberCount++; break;
      }
    });
  }

  // Current war data
  if (riverRace) {
    const myClan = riverRace.clan;
    analytics.currentWar = {
      state: riverRace.state,
      periodIndex: riverRace.periodIndex,
      periodType: riverRace.periodType,
      fame: myClan.fame,
      totalDecksUsed: myClan.totalDecksUsed,
      participants: myClan.participants?.length || 0,
      battlesPlayed: myClan.battlesPlayed || 0,
      wins: myClan.wins || 0,
      losses: (myClan.battlesPlayed || 0) - (myClan.wins || 0),
      winRate: myClan.battlesPlayed > 0 ? (myClan.wins / myClan.battlesPlayed) : 0,
      rank: myClan.rank || 0,
      clansInRace: riverRace.clans?.length || 0
    };
  }

  // War history
  if (riverRaceLog && riverRaceLog.items) {
    analytics.warHistory = riverRaceLog.items.map(war => {
      const standing = war.standings?.find(s => s.clan.tag === clan.tag);
      return {
        seasonId: war.seasonId,
        sectionIndex: war.sectionIndex,
        createdDate: war.createdDate,
        rank: standing?.rank || 0,
        trophyChange: standing?.trophyChange || 0,
        fame: standing?.clan.fame || 0,
        participants: standing?.clan.participants?.length || 0,
        battlesPlayed: standing?.clan.battlesPlayed || 0,
        wins: standing?.clan.wins || 0,
        clanScore: standing?.clan.clanScore || 0
      };
    });
  }

  return analytics;
}

// Process battles with enhanced statistics including deck analysis
function processBattles(battleLog, playerTag, filters = {}) {
  const cardStats = {}; // { cardName: { count, wins, losses, levels: [] } }
  const deckStats = {}; // { deckId: { deck: [], wins, losses, battles, opponentCards: {} } }
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

    // Filter for competitive battle types (API returns mixed case, docs show uppercase)
    const competitiveTypes = [
      'PvP', 'PVP',                           // Standard 1v1
      'casual1v1', 'CASUAL_1V1',              // Casual 1v1
      'pathOfLegend', 'PATH_OF_LEGEND',       // Path of Legend
      'tournament', 'TOURNAMENT',              // Tournament
      'riverRacePvP', 'RIVER_RACE_PVP'        // River Race PvP
    ];

    // Apply battle type filter
    if (filters.types && !filters.types.includes(battle.type)) {
      continue;
    }

    if (competitiveTypes.includes(battle.type)) {
      totalBattles++;
      battleTypeCounts[battle.type] = (battleTypeCounts[battle.type] || 0) + 1;

      const opponentDeck = getOpponentDeck(battle, playerTag);
      const playerDeck = getPlayerDeck(battle, playerTag);
      const playerWon = getPlayerWonStatus(battle, playerTag);

      if (opponentDeck && opponentDeck.length > 0) {
        processedBattles++;

        // Track player's deck stats
        if (playerDeck && playerDeck.length > 0) {
          const deckId = createDeckId(playerDeck);

          if (!deckStats[deckId]) {
            deckStats[deckId] = {
              deck: playerDeck.map(c => ({ name: c.name, level: c.level })),
              wins: 0,
              losses: 0,
              battles: 0,
              opponentCards: {}
            };
          }

          deckStats[deckId].battles++;
          if (playerWon !== null) {
            if (playerWon) {
              deckStats[deckId].wins++;
            } else {
              deckStats[deckId].losses++;
            }
          }

          // Track opponent cards faced by this deck
          for (const card of opponentDeck) {
            const cardName = card.name;
            if (!deckStats[deckId].opponentCards[cardName]) {
              deckStats[deckId].opponentCards[cardName] = {
                count: 0,
                wins: 0,
                losses: 0
              };
            }
            deckStats[deckId].opponentCards[cardName].count++;
            if (playerWon !== null) {
              if (playerWon) {
                deckStats[deckId].opponentCards[cardName].wins++;
              } else {
                deckStats[deckId].opponentCards[cardName].losses++;
              }
            }
          }
        }

        // Track each opponent card (overall stats)
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

  // Calculate overall win/loss stats
  const totalWins = cards.reduce((sum, card) => sum + card.wins, 0);
  const totalLosses = cards.reduce((sum, card) => sum + card.losses, 0);
  const totalMatches = totalWins + totalLosses;
  const overallWinRate = totalMatches > 0 ? totalWins / totalMatches : 0;

  // Find most common card
  const mostCommonCard = cards.length > 0 ? cards[0].name : 'N/A';

  // Calculate streaks and highlights
  const streaks = calculateStreaks(battleLog, playerTag);
  const avgCrownsFor = totalBattles > 0
    ? (battleLog.reduce((sum, b) => {
        const playerData = b.team?.find(p => p.tag === playerTag);
        return sum + (playerData?.crowns || 0);
      }, 0) / totalBattles).toFixed(1)
    : 0;
  const avgCrownsAgainst = totalBattles > 0
    ? (battleLog.reduce((sum, b) => {
        const oppData = b.opponent?.[0];
        return sum + (oppData?.crowns || 0);
      }, 0) / totalBattles).toFixed(1)
    : 0;

  // Build deck analysis data
  const decks = Object.entries(deckStats)
    .map(([deckId, stats]) => {
      const winRate = stats.battles > 0 ? stats.wins / stats.battles : 0;

      // Get top opponent cards for this deck
      const topOpponentCards = Object.entries(stats.opponentCards)
        .map(([cardName, cardStats]) => {
          const cardWinRate = (cardStats.wins + cardStats.losses) > 0
            ? cardStats.wins / (cardStats.wins + cardStats.losses)
            : null;
          return {
            name: cardName,
            count: cardStats.count,
            wins: cardStats.wins,
            losses: cardStats.losses,
            winRate: cardWinRate
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        deckId,
        deck: stats.deck,
        battles: stats.battles,
        wins: stats.wins,
        losses: stats.losses,
        winRate,
        topOpponentCards
      };
    })
    .sort((a, b) => b.battles - a.battles);

  // Calculate biggest counters (cards with worst win rate, minimum 3 encounters)
  const counterCards = cards
    .filter(card => (card.wins + card.losses) >= 3)
    .map(card => ({
      name: card.name,
      count: card.count,
      wins: card.wins,
      losses: card.losses,
      winRate: card.winRate,
      metadata: card.metadata,
      lossRate: 1 - (card.winRate || 0)
    }))
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 10);

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
      uniqueCards: cards.length,
      avgOpponentLevel: allLevels.length > 0
        ? Math.round((allLevels.reduce((a, b) => a + b, 0) / allLevels.length) * 10) / 10
        : 0,
      avgElixirCost: allElixir.length > 0
        ? Math.round((allElixir.reduce((a, b) => a + b, 0) / allElixir.length) * 10) / 10
        : 0,
      totalWins,
      totalLosses,
      overallWinRate,
      mostCommonCard,
      uniqueDecksUsed: decks.length,
      avgCrownsFor: parseFloat(avgCrownsFor),
      avgCrownsAgainst: parseFloat(avgCrownsAgainst),
      streaks: streaks
    },
    cards,
    decks,
    counterCards,
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

// Get player deck from battle
function getPlayerDeck(battle, playerTag) {
  try {
    // Standard 1v1 battle
    if (battle.team && Array.isArray(battle.team)) {
      const playerData = battle.team.find(p => p.tag === playerTag);
      if (playerData && playerData.cards) {
        return playerData.cards;
      }
    }

    // Team battles
    if (battle.teams && battle.teams.length >= 2) {
      for (const team of battle.teams) {
        const playerData = team.find(player => player.tag === playerTag);
        if (playerData && playerData.cards) {
          return playerData.cards;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting player deck:', error);
    return null;
  }
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

// Create unique deck identifier from card names
function createDeckId(deck) {
  return deck
    .map(card => card.name)
    .sort()
    .join('|');
}

// Calculate streaks and highlights
function calculateStreaks(battleLog, playerTag) {
  const competitiveTypes = [
    'PvP', 'PVP',
    'casual1v1', 'CASUAL_1V1',
    'pathOfLegend', 'PATH_OF_LEGEND',
    'tournament', 'TOURNAMENT',
    'riverRacePvP', 'RIVER_RACE_PVP'
  ];

  const battles = battleLog
    .filter(battle => competitiveTypes.includes(battle.type))
    .reverse(); // Chronological order

  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let lastResult = null;

  for (const battle of battles) {
    const won = getPlayerWonStatus(battle, playerTag);

    if (won === null) continue;

    if (won) {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > longestWinStreak) {
        longestWinStreak = currentWinStreak;
      }
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > longestLossStreak) {
        longestLossStreak = currentLossStreak;
      }
    }

    lastResult = won;
  }

  // Current streak (most recent)
  if (lastResult === true) {
    currentStreak = currentWinStreak;
  } else if (lastResult === false) {
    currentStreak = -currentLossStreak;
  }

  return {
    current: currentStreak,
    longestWin: longestWinStreak,
    longestLoss: longestLossStreak
  };
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
