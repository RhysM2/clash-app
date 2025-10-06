import React from 'react';
import { motion } from 'framer-motion';
import './Statistics.css';

function Statistics({ analysis }) {
  const winRatePercent = (analysis.overallWinRate * 100).toFixed(1);
  const winRateClass = analysis.overallWinRate >= 0.6 ? 'good' : analysis.overallWinRate >= 0.4 ? 'neutral' : 'bad';

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

  return (
    <motion.div
      className="statistics-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="statistics-title">⚔️ Battle Analysis</h2>

      {/* Main Stats Row */}
      <motion.div
        className="stats-row"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className={`stat-card-large highlight ${winRateClass}`}
          variants={itemVariants}
          whileHover={{ scale: 1.03, y: -5 }}
        >
          <div className="stat-icon-large">🏆</div>
          <div className="stat-content">
            <div className="stat-label">Your Win Rate</div>
            <div className="stat-value-large">{winRatePercent}%</div>
            <div className="stat-detail">
              {analysis.totalWins}W - {analysis.totalLosses}L ({analysis.totalBattles} battles)
            </div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card-large highlight"
          variants={itemVariants}
          whileHover={{ scale: 1.03, y: -5 }}
        >
          <div className="stat-icon-large">⭐</div>
          <div className="stat-content">
            <div className="stat-label">Most Common Card</div>
            <div className="stat-value-card">{analysis.mostCommonCard}</div>
            <div className="stat-detail">{analysis.uniqueCards} unique cards faced</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Secondary Stats Grid */}
      <motion.div
        className="stats-grid-compact"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="stat-card-small"
          variants={itemVariants}
          whileHover={{ scale: 1.03, y: -3 }}
        >
          <div className="stat-icon-small">⚡</div>
          <div className="stat-content">
            <div className="stat-label">Avg Elixir Cost</div>
            <div className="stat-value">{analysis.avgElixirCost}</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card-small"
          variants={itemVariants}
          whileHover={{ scale: 1.03, y: -3 }}
        >
          <div className="stat-icon-small">📊</div>
          <div className="stat-content">
            <div className="stat-label">Avg Card Level</div>
            <div className="stat-value">{analysis.avgOpponentLevel}</div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Statistics;
