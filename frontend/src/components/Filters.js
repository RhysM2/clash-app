import React from 'react';
import './Filters.css';

const BATTLE_TYPES = [
  { value: 'PvP', label: 'Ranked PvP' },
  { value: 'Casual1v1', label: 'Casual 1v1' },
  { value: 'PathOfLegend', label: 'Path of Legend' },
  { value: 'Tournament', label: 'Tournament' }
];

const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
];

function Filters({ filters, onFilterChange, disabled }) {
  const handleTypeToggle = (type) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];

    onFilterChange({ ...filters, types: newTypes });
  };

  const handleTimeRangeChange = (e) => {
    onFilterChange({ ...filters, timeRange: e.target.value });
  };

  return (
    <div className="filters-container">
      <div className="filter-section">
        <h3 className="filter-title">Battle Types</h3>
        <div className="filter-checkboxes">
          {BATTLE_TYPES.map(({ value, label }) => (
            <label key={value} className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.types.includes(value)}
                onChange={() => handleTypeToggle(value)}
                disabled={disabled}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Time Range</h3>
        <select
          value={filters.timeRange}
          onChange={handleTimeRangeChange}
          disabled={disabled}
          className="time-range-select"
        >
          {TIME_RANGES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Filters;
