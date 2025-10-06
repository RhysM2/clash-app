import React from 'react';
import { motion } from 'framer-motion';
import './PlayerProfile.css';

function PlayerProfile({ player }) {
  return (
    <motion.div
      className="player-profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="profile-header">
        <motion.div
          className="profile-avatar"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {player.arena?.iconUrl ? (
            <img src={player.arena.iconUrl} alt={player.arena.name} className="arena-icon" />
          ) : (
            <div className="default-avatar">
              <span>🏆</span>
            </div>
          )}
        </motion.div>

        <motion.div
          className="profile-main"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="player-name">{player.name}</h2>
          <p className="player-tag">{player.tag}</p>
        </motion.div>

        <motion.div
          className="profile-stats"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="stat"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="stat-value">{player.trophies.toLocaleString()}</span>
            <span className="stat-label">🏆 Trophies</span>
          </motion.div>
          <motion.div
            className="stat"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="stat-value">Level {player.level}</span>
            <span className="stat-label">⭐ King Level</span>
          </motion.div>
          <motion.div
            className="stat"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="stat-value">{(player.winRate * 100).toFixed(1)}%</span>
            <span className="stat-label">📊 Win Rate</span>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="profile-details"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="detail-item">
          <span className="detail-label">Best Trophies:</span>
          <span className="detail-value">{player.bestTrophies.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Record:</span>
          <span className="detail-value">{player.wins}W - {player.losses}L</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">3-Crown Wins:</span>
          <span className="detail-value">{player.threeCrownWins}</span>
        </div>
        {player.clan && (
          <div className="detail-item">
            <span className="detail-label">Clan:</span>
            <span className="detail-value">{player.clan.name}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Arena:</span>
          <span className="detail-value">{player.arena.name}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PlayerProfile;
