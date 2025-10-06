import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DeckAnalysis.css';

function DeckAnalysis({ decks }) {
  const [expandedDeck, setExpandedDeck] = useState(null);

  if (!decks || decks.length === 0) {
    return null;
  }

  const toggleDeck = (deckId) => {
    setExpandedDeck(expandedDeck === deckId ? null : deckId);
  };

  const getWinRateClass = (winRate) => {
    if (winRate >= 0.6) return 'good';
    if (winRate >= 0.4) return 'neutral';
    return 'bad';
  };

  return (
    <motion.div
      className="deck-analysis-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="deck-header">
        <h2 className="deck-title">🃏 Your Deck Analysis</h2>
        <p className="deck-subtitle">
          {decks.length} unique deck{decks.length > 1 ? 's' : ''} used in recent battles
        </p>
      </div>

      <div className="decks-list">
        {decks.map((deckData, index) => {
          const isExpanded = expandedDeck === deckData.deckId;
          const winRateClass = getWinRateClass(deckData.winRate);

          return (
            <motion.div
              key={deckData.deckId}
              className={`deck-item ${winRateClass}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="deck-summary"
                onClick={() => toggleDeck(deckData.deckId)}
              >
                <div className="deck-summary-left">
                  <div className="deck-cards-preview">
                    {deckData.deck.slice(0, 8).map((card, i) => (
                      <div key={i} className="deck-card-mini" title={card.name}>
                        <span className="card-name-mini">{card.name.charAt(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="deck-info">
                    <h3 className="deck-name">Deck #{index + 1}</h3>
                    <p className="deck-battles">{deckData.battles} battles</p>
                  </div>
                </div>

                <div className="deck-summary-right">
                  <div className="deck-win-rate">
                    <span className={`deck-percentage ${winRateClass}`}>
                      {(deckData.winRate * 100).toFixed(1)}%
                    </span>
                    <span className="deck-record">
                      {deckData.wins}W - {deckData.losses}L
                    </span>
                  </div>
                  <button className="deck-expand-btn">
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="deck-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="deck-cards-full">
                      <h4 className="section-title">Your Deck ({deckData.deck.length} cards)</h4>
                      <div className="cards-grid">
                        {deckData.deck.map((card, i) => (
                          <div key={i} className="card-mini">
                            <span className="card-name">{card.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {deckData.topOpponentCards && deckData.topOpponentCards.length > 0 && (
                      <div className="deck-opponent-cards">
                        <h4 className="section-title">
                          Most Common Opponent Cards (vs this deck)
                        </h4>
                        <div className="opponent-cards-grid">
                          {deckData.topOpponentCards.map((card, i) => (
                            <div key={i} className="opponent-card-item">
                              <div className="opponent-card-header">
                                <span className="opponent-card-name">{card.name}</span>
                                <span className="opponent-card-count">{card.count}x</span>
                              </div>
                              {card.winRate !== null && (
                                <div className="opponent-card-stats">
                                  <span className={`opponent-win-rate ${getWinRateClass(card.winRate)}`}>
                                    {(card.winRate * 100).toFixed(0)}% WR
                                  </span>
                                  <span className="opponent-record">
                                    {card.wins}W-{card.losses}L
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default DeckAnalysis;
