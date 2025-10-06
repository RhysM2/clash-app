import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      className="header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        <div className="header-logo">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Clash Royale Card Counter" className="logo-image" />
          <div className="logo-text">
            <span className="logo-title">CR Card Counter</span>
            <span className="logo-subtitle">Data Analytics</span>
          </div>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          <a href="#home" className="nav-link active">
            Home
          </a>
          <a href="#stats" className="nav-link">
            Statistics
          </a>
          <a href="#about" className="nav-link">
            About
          </a>
        </nav>
      </div>
    </motion.header>
  );
}

export default Header;
