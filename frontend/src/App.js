import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import PlayerProfile from './components/PlayerProfile';
import Filters from './components/Filters';
import Statistics from './components/Statistics';
import CounterCards from './components/CounterCards';
import DeckAnalysis from './components/DeckAnalysis';
import CardChart from './components/CardChart';
import CardList from './components/CardList';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import ClanDashboard from './components/ClanDashboard';
import { getCardCounts } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('player'); // 'player' or 'clan'
  const [playerTag, setPlayerTag] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    types: [],
    timeRange: 'all'
  });

  const handleSearch = async (tag) => {
    if (!tag || tag.trim() === '') {
      setError('Please enter a player tag');
      return;
    }

    setLoading(true);
    setError(null);
    setPlayerTag(tag);

    try {
      const result = await getCardCounts(tag, filters);
      setData(result);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);

    if (playerTag) {
      setLoading(true);
      setError(null);

      try {
        const result = await getCardCounts(playerTag, newFilters);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="App">
      <Header />

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'player' ? 'active' : ''}`}
          onClick={() => setActiveTab('player')}
        >
          👤 Player Analytics
        </button>
        <button
          className={`tab-button ${activeTab === 'clan' ? 'active' : ''}`}
          onClick={() => setActiveTab('clan')}
        >
          👥 Clan Dashboard
        </button>
      </div>

      <main className="App-main">
        {activeTab === 'player' && (
          <>
            <SearchBar onSearch={handleSearch} loading={loading} />

        {error && <ErrorMessage message={error} />}

        {loading && <LoadingSpinner />}

        {data && !loading && (
          <>
            {data.player && <PlayerProfile player={data.player} />}

            <Filters
              filters={filters}
              onFilterChange={handleFilterChange}
              disabled={loading}
            />

            {data.analysis && (
              <Statistics analysis={data.analysis} />
            )}

            {data.counterCards && data.counterCards.length > 0 && (
              <CounterCards counterCards={data.counterCards} />
            )}

            {data.decks && data.decks.length > 0 && (
              <DeckAnalysis decks={data.decks} />
            )}

            {data.cards && data.cards.length > 0 && (
              <CardChart cards={data.cards} />
            )}

            {data.cards && data.cards.length > 0 ? (
              <CardList cards={data.cards} />
            ) : (
              <div className="no-data">
                <p>No battles found matching your filters.</p>
                <p className="hint">Try adjusting your filters or use a different player tag.</p>
              </div>
            )}
          </>
        )}

        {!data && !loading && !error && (
          <div className="welcome">
            <div className="welcome-card">
              <h2>Welcome! 👋</h2>
              <p>Enter a Clash Royale player tag to analyze:</p>
              <ul>
                <li>✅ Most common opponent cards</li>
                <li>✅ Your win rate against each card</li>
                <li>✅ Average opponent card levels</li>
                <li>✅ Filter by battle type and time range</li>
              </ul>
              <p className="example">Example: <code>8C2PLQGY</code> or <code>#8C2PLQGY</code></p>
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === 'clan' && <ClanDashboard />}
      </main>

      <footer className="App-footer">
        <p>Made with ❤️ for Clash Royale players</p>
        <p className="credits">Data from Clash Royale API • Backend powered by Azure</p>
      </footer>
    </div>
  );
}

export default App;
