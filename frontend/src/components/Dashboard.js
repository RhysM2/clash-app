import React from 'react';
import { motion } from 'framer-motion';
import './Dashboard.css';

function Dashboard({ analysis, decks, player }) {
  if (!analysis) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getStreakClass = (streak) => {
    if (streak > 0) return 'win-streak';
    if (streak < 0) return 'loss-streak';
    return 'neutral';
  };

  const getWinRateClass = (winRate) => {
    if (winRate >= 0.6) return 'good';
    if (winRate >= 0.4) return 'neutral';
    return 'bad';
  };

  const formatStreak = (streak) => {
    if (streak > 0) return `${streak}W 🔥`;
    if (streak < 0) return `${Math.abs(streak)}L 💀`;
    return '--';
  };

  const recentDecks = decks?.slice(0, 3) || [];

  return (
    <motion.div
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Quick Stats */}
      <motion.div className="dashboard-section quick-stats" variants={itemVariants}>
        <h2 className="section-header">📊 Quick Stats</h2>
        <div className="stats-grid-home">
          <div className={`stat-box-home highlight ${getWinRateClass(analysis.overallWinRate)}`}>
            <div className="stat-icon-home">🏆</div>
            <div className="stat-content-home">
              <div className="stat-value-home">{(analysis.overallWinRate * 100).toFixed(1)}%</div>
              <div className="stat-label-home">Win Rate</div>
              <div className="stat-detail-home">{analysis.totalWins}W - {analysis.totalLosses}L</div>
            </div>
          </div>

          <div className="stat-box-home">
            <div className="stat-icon-home">⚔️</div>
            <div className="stat-content-home">
              <div className="stat-value-home">{analysis.totalBattles}</div>
              <div className="stat-label-home">Total Battles</div>
              <div className="stat-detail-home">Last {analysis.dateRange?.daysSpan || 30} days</div>
            </div>
          </div>

          <div className="stat-box-home">
            <div className="stat-icon-home">👑</div>
            <div className="stat-content-home">
              <div className="stat-value-home">{analysis.avgCrownsFor}</div>
              <div className="stat-label-home">Avg Crowns</div>
              <div className="stat-detail-home">vs {analysis.avgCrownsAgainst} opponent</div>
            </div>
          </div>

          <div className="stat-box-home">
            <div className="stat-icon-home">🃏</div>
            <div className="stat-content-home">
              <div className="stat-value-home">{analysis.uniqueDecksUsed}</div>
              <div className="stat-label-home">Decks Used</div>
              <div className="stat-detail-home">{analysis.uniqueCards} unique cards</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Highlights */}
      {analysis.streaks && (
        <motion.div className="dashboard-section highlights" variants={itemVariants}>
          <h2 className="section-header">✨ Recent Highlights</h2>
          <div className="highlights-grid">
            <div className={`highlight-box ${getStreakClass(analysis.streaks.current)}`}>
              <div className="highlight-icon">🔥</div>
              <div className="highlight-content">
                <div className="highlight-label">Current Streak</div>
                <div className="highlight-value">{formatStreak(analysis.streaks.current)}</div>
              </div>
            </div>

            <div className="highlight-box win-streak">
              <div className="highlight-icon">🚀</div>
              <div className="highlight-content">
                <div className="highlight-label">Best Run</div>
                <div className="highlight-value">{analysis.streaks.longestWin} Wins</div>
              </div>
            </div>

            <div className="highlight-box loss-streak">
              <div className="highlight-icon">⚠️</div>
              <div className="highlight-content">
                <div className="highlight-label">Worst Tilt</div>
                <div className="highlight-value">{analysis.streaks.longestLoss} Losses</div>
              </div>
            </div>

            <div className="highlight-box neutral">
              <div className="highlight-icon">⭐</div>
              <div className="highlight-content">
                <div className="highlight-label">Top Counter</div>
                <div className="highlight-value">{analysis.mostCommonCard}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recently Used Decks */}
      {recentDecks.length > 0 && (
        <motion.div className="dashboard-section recent-decks" variants={itemVariants}>
          <h2 className="section-header">🎴 Recently Used Decks</h2>
          <div className="decks-grid-home">
            {recentDecks.map((deck, index) => (
              <motion.div
                key={deck.deckId}
                className={`deck-card-home ${getWinRateClass(deck.winRate)}`}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="deck-card-header-home">
                  <span className="deck-number">#{index + 1}</span>
                  <span className={`deck-wr ${getWinRateClass(deck.winRate)}`}>
                    {(deck.winRate * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="deck-cards-mini-grid">
                  {deck.deck.slice(0, 8).map((card, i) => (
                    <div key={i} className="mini-card-icon" title={card.name}>
                      {card.name.charAt(0)}
                    </div>
                  ))}
                </div>

                <div className="deck-card-stats">
                  <div className="deck-stat">
                    <span className="deck-stat-label">Battles:</span>
                    <span className="deck-stat-value">{deck.battles}</span>
                  </div>
                  <div className="deck-stat">
                    <span className="deck-stat-label">Record:</span>
                    <span className="deck-stat-value success">{deck.wins}W</span>
                    <span className="deck-stat-separator">-</span>
                    <span className="deck-stat-value danger">{deck.losses}L</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Dashboard;
