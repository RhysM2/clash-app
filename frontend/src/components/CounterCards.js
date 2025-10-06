import React from 'react';
import { motion } from 'framer-motion';
import './CounterCards.css';

function CounterCards({ counterCards }) {
  if (!counterCards || counterCards.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const getRarityClass = (rarity) => {
    return (rarity || 'common').toLowerCase();
  };

  const getWinRateClass = (winRate) => {
    if (winRate < 0.4) return 'very-bad';
    if (winRate < 0.5) return 'bad';
    return 'neutral';
  };

  return (
    <motion.div
      className="counter-cards-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="counter-header">
        <h2 className="counter-title">⚠️ Biggest Counter Cards</h2>
        <p className="counter-subtitle">Cards you struggle against the most</p>
      </div>

      <motion.div
        className="counter-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {counterCards.map((card, index) => (
          <motion.div
            key={card.name}
            className={`counter-card ${getWinRateClass(card.winRate)}`}
            variants={itemVariants}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <div className="counter-rank">#{index + 1}</div>

            <div className="counter-content">
              <div className="counter-card-header">
                {card.metadata?.iconUrl && (
                  <img
                    src={card.metadata.iconUrl}
                    alt={card.name}
                    className="counter-card-icon"
                  />
                )}
                <div className="counter-card-info">
                  <h3 className="counter-card-name">{card.name}</h3>
                  <span className={`counter-card-rarity ${getRarityClass(card.metadata?.rarity)}`}>
                    {card.metadata?.rarity || 'Common'}
                  </span>
                </div>
              </div>

              <div className="counter-stats">
                <div className="counter-stat-main">
                  <div className="counter-win-rate">
                    <span className="counter-percentage">{(card.winRate * 100).toFixed(1)}%</span>
                    <span className="counter-label">Win Rate</span>
                  </div>
                  <div className="counter-loss-rate">
                    <span className="counter-percentage danger">{(card.lossRate * 100).toFixed(1)}%</span>
                    <span className="counter-label">Loss Rate</span>
                  </div>
                </div>

                <div className="counter-stat-details">
                  <div className="counter-detail">
                    <span className="counter-detail-label">Faced:</span>
                    <span className="counter-detail-value">{card.count}x</span>
                  </div>
                  <div className="counter-detail">
                    <span className="counter-detail-label">Record:</span>
                    <span className="counter-detail-value success">{card.wins}W</span>
                    <span className="counter-detail-separator">-</span>
                    <span className="counter-detail-value danger">{card.losses}L</span>
                  </div>
                  {card.metadata?.elixirCost && (
                    <div className="counter-detail">
                      <span className="counter-detail-label">Elixir:</span>
                      <span className="counter-detail-value">{card.metadata.elixirCost}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default CounterCards;
