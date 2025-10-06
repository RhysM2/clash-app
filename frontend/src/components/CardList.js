import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './CardList.css';
import { RARITY_COLORS } from '../config';

function CardItem({ card, rank, index }) {
  const rarityColor = RARITY_COLORS[card.metadata.rarity.toLowerCase()] || RARITY_COLORS.common;
  const winRatePercent = card.winRate !== null ? (card.winRate * 100).toFixed(1) : 'N/A';
  const winRateClass = card.winRate >= 0.6 ? 'good' : card.winRate >= 0.4 ? 'neutral' : 'bad';

  return (
    <motion.div
      className="card-item"
      style={{ borderLeftColor: rarityColor, color: rarityColor }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ x: 6 }}
    >
      <div className="card-rank">#{rank}</div>

      <div className="card-image-container">
        {card.metadata.iconUrl ? (
          <img
            src={card.metadata.iconUrl}
            alt={card.name}
            className="card-image"
            loading="lazy"
          />
        ) : (
          <div className="card-image-placeholder">?</div>
        )}
      </div>

      <div className="card-info">
        <h3 className="card-name">{card.name}</h3>
        <div className="card-meta">
          <span className="elixir" title="Elixir Cost">
            ⚡ {card.metadata.elixirCost}
          </span>
          <span
            className="rarity"
            style={{ color: rarityColor }}
            title="Rarity"
          >
            {card.metadata.rarity}
          </span>
        </div>
      </div>

      <div className="card-stats">
        <div className="stat-group">
          <div className="stat-main">
            <span className="stat-label">Encountered</span>
            <span className="stat-value">{card.count}</span>
            <span className="stat-percent">{(card.percentage * 100).toFixed(0)}%</span>
          </div>

          {card.winRate !== null && (
            <div className={`stat-winrate ${winRateClass}`}>
              <span className="stat-label">Your Win Rate</span>
              <span className="stat-value">{winRatePercent}%</span>
              <span className="stat-record">
                {card.wins}W-{card.losses}L
              </span>
            </div>
          )}
        </div>

        <div className="stat-group">
          <div className="stat-level">
            <span className="stat-label">Opponent Avg Level</span>
            <span className="stat-value">{card.opponentStats.avgLevel}</span>
            <span className="stat-range">
              ({card.opponentStats.minLevel}-{card.opponentStats.maxLevel})
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CardList({ cards }) {
  const [showCount, setShowCount] = useState(15);

  const visibleCards = cards.slice(0, showCount);
  const hasMore = cards.length > showCount;

  return (
    <motion.div
      className="card-list-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="card-list-header">
        <h2>Opponent Card Frequency</h2>
        <p className="card-count">Showing {visibleCards.length} of {cards.length} unique cards</p>
      </div>

      <div className="card-list">
        {visibleCards.map((card, index) => (
          <CardItem key={card.name} card={card} rank={index + 1} index={index} />
        ))}
      </div>

      {hasMore && (
        <motion.button
          className="load-more-button"
          onClick={() => setShowCount(showCount + 15)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Show More ({cards.length - showCount} remaining)
        </motion.button>
      )}
    </motion.div>
  );
}

export default CardList;
