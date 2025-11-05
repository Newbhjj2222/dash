'use client';
import React from 'react';
import { FaCommentDots, FaRegCircle, FaCog } from 'react-icons/fa';
import styles from './Footer.module.css'; // Module CSS

const Footer = ({ setActivePage, activePage }) => {
  return (
    <div className={styles.footerNav}>
      <button onClick={() => setActivePage('chat')} className={styles.navButton}>
        <FaCommentDots 
          size={22} 
          color={activePage === 'chat' ? '#25D366' : '#555'} 
        />
      </button>

      <button onClick={() => setActivePage('status')} className={styles.navButton}>
        <FaRegCircle 
          size={22} 
          color={activePage === 'status' ? '#25D366' : '#555'} 
        />
      </button>

      <button onClick={() => setActivePage('settings')} className={styles.navButton}>
        <FaCog 
          size={22} 
          color={activePage === 'settings' ? '#25D366' : '#555'} 
        />
      </button>
    </div>
  );
};

export default Footer;
