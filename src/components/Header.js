'use client';
import React, { useState } from 'react';
import styles from './Header.module.css'; // Hano twakoresheje module CSS

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className={styles.appHeader}>
      <div className={styles.logo}>NetChat</div>

      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search chats or contacts"
      />

      <div className={styles.menuIcon} onClick={toggleMenu}>
        ☰
      </div>

      {menuOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.menuItem}>👤 Profile</div>
          <div className={styles.menuItem}>💬 Chat</div>
          <div className={styles.menuItem}>📷 Status</div>
          <div className={styles.menuItem}>👥 Group</div>
          <div className={styles.menuItem}>⚙️ Settings</div>
        </div>
      )}
    </header>
  );
};

export default Header;
