import React, { useState } from 'react';
import axios from 'axios';
import './ClanDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function ClanDashboard() {
  const [clanTag, setClanTag] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('trophies');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchClanData = async (tag) => {
    if (!tag || tag.trim() === '') {
      setError('Please enter a clan tag');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanTag = tag.replace('#', '').toUpperCase();

      // Fetch analytics and members in parallel
      const [analyticsRes, membersRes] = await Promise.all([
        axios.get(`${API_URL}/api/clan/${cleanTag}/analytics`),
        axios.get(`${API_URL}/api/clan/${cleanTag}/members?sortBy=${sortBy}&order=${sortOrder}`)
      ]);

      setAnalytics(analyticsRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setAnalytics(null);
      setMembers(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchClanData(clanTag);
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);

    if (clanTag) {
      fetchClanData(clanTag);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      leader: '👑',
      coLeader: '⭐',
      elder: '🛡️',
      member: '👤'
    };
    return badges[role] || '👤';
  };

  return (
    <div className="clan-dashboard">
      <div className="clan-header">
        <h1>Clan Analytics</h1>
        <form onSubmit={handleSubmit} className="clan-search">
          <input
            type="text"
            placeholder="Enter Clan Tag (e.g., #GPL90PJY)"
            value={clanTag}
            onChange={(e) => setClanTag(e.target.value)}
            className="clan-input"
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? 'Loading...' : 'Search Clan'}
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Fetching clan data...</p>
        </div>
      )}

      {analytics && !loading && (
        <div className="clan-content">
          {/* Clan Overview */}
          <div className="clan-overview">
            <div className="clan-info-header">
              <h2>{analytics.clan.name}</h2>
              <p className="clan-tag">{analytics.clan.tag}</p>
              <p className="clan-description">{analytics.clan.description}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Members</div>
                <div className="stat-value">{analytics.clan.members}/50</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Trophy Req</div>
                <div className="stat-value">{analytics.clan.requiredTrophies.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Clan Score</div>
                <div className="stat-value">{analytics.clan.clanScore.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">War Trophies</div>
                <div className="stat-value">{analytics.clan.clanWarTrophies.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg Trophies</div>
                <div className="stat-value">{analytics.summary.avgTrophies.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Donations</div>
                <div className="stat-value">{analytics.summary.totalDonations.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Current War */}
          {analytics.currentWar && (
            <div className="current-war">
              <h3>Current River Race</h3>
              <div className="war-stats">
                <div className="war-stat">
                  <span className="war-label">Rank:</span>
                  <span className="war-value">{analytics.currentWar.rank}/{analytics.currentWar.clansInRace}</span>
                </div>
                <div className="war-stat">
                  <span className="war-label">Fame:</span>
                  <span className="war-value">{analytics.currentWar.fame.toLocaleString()}</span>
                </div>
                <div className="war-stat">
                  <span className="war-label">Participants:</span>
                  <span className="war-value">{analytics.currentWar.participants}</span>
                </div>
                <div className="war-stat">
                  <span className="war-label">Battles:</span>
                  <span className="war-value">{analytics.currentWar.battlesPlayed} ({analytics.currentWar.wins}W-{analytics.currentWar.losses}L)</span>
                </div>
                <div className="war-stat">
                  <span className="war-label">Win Rate:</span>
                  <span className="war-value">{(analytics.currentWar.winRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* War History */}
          {analytics.warHistory && analytics.warHistory.length > 0 && (
            <div className="war-history">
              <h3>War History (Last {analytics.warHistory.length})</h3>
              <table className="war-history-table">
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Rank</th>
                    <th>Fame</th>
                    <th>Participants</th>
                    <th>Battles</th>
                    <th>Wins</th>
                    <th>Trophy Change</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.warHistory.map((war, index) => (
                    <tr key={index}>
                      <td>{war.seasonId}-{war.sectionIndex}</td>
                      <td className={war.rank <= 3 ? 'rank-top' : ''}>{war.rank}</td>
                      <td>{war.fame.toLocaleString()}</td>
                      <td>{war.participants}</td>
                      <td>{war.battlesPlayed}</td>
                      <td>{war.wins}</td>
                      <td className={war.trophyChange > 0 ? 'positive' : 'negative'}>
                        {war.trophyChange > 0 ? '+' : ''}{war.trophyChange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Members Table */}
          {members && (
            <div className="members-section">
              <h3>Clan Members ({members.memberCount})</h3>
              <table className="members-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('clanRank')} style={{cursor: 'pointer'}}>
                      Rank {sortBy === 'clanRank' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('name')} style={{cursor: 'pointer'}}>
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Role</th>
                    <th onClick={() => handleSort('trophies')} style={{cursor: 'pointer'}}>
                      Trophies {sortBy === 'trophies' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('donations')} style={{cursor: 'pointer'}}>
                      Donations {sortBy === 'donations' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('donationsReceived')} style={{cursor: 'pointer'}}>
                      Received {sortBy === 'donationsReceived' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.members.map((member, index) => (
                    <tr key={member.tag} className={index < 3 ? 'top-member' : ''}>
                      <td>{member.clanRank}</td>
                      <td>
                        <div className="member-name">
                          {member.name}
                          <span className="member-tag">{member.tag}</span>
                        </div>
                      </td>
                      <td>
                        <span className="role-badge">
                          {getRoleBadge(member.role)} {member.role}
                        </span>
                      </td>
                      <td className="trophies">
                        {member.trophies.toLocaleString()}
                        {member.previousClanRank !== member.clanRank && (
                          <span className={member.clanRank < member.previousClanRank ? 'trend-up' : 'trend-down'}>
                            {member.clanRank < member.previousClanRank ? ' ↗' : ' ↘'}
                          </span>
                        )}
                      </td>
                      <td>{member.donations.toLocaleString()}</td>
                      <td>{member.donationsReceived.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClanDashboard;
