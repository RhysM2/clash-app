import React, { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, loading }) {
  const [tag, setTag] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(tag);
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Enter player tag (e.g., 8C2PLQGY)"
          disabled={loading}
          className="search-input"
        />
        <button
          type="submit"
          disabled={loading || !tag.trim()}
          className="search-button"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  );
}

export default SearchBar;
