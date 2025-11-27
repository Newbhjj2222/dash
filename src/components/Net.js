// components/Net.js
'use client';

import React, { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi"; // menu icons
import styles from "./Net.module.css";

const Net = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">NetBoard</Link>
      </div>
      <div className={styles.menuIcon} onClick={toggleMenu}>
        {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </div>
      <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/create">Publish Stories</Link>
          </li>
          <li>
            <Link href="/balance">Balance</Link>
          </li>
          <li>
            <Link href="/monitize">Monetization</Link>
          </li>
          <li>
            <Link href="/rules">Rules</Link>
          </li>
          <li>
            <Link href="/rules">Rules</Link>
          </li>
         <li>
            <Link href="/lyrics">write songs</Link>
          </li>
           <li>
            <Link href="/share">Share your stories</Link>
          </li>
         <li>
            <Link href="/ly">Manage your songs</Link>
          </li>
          <li>
            <Link href="/profile">Profile</Link>
          </li>
          <li>
            <Link href="/inf">Net Influencer</Link>
          </li>
          <li>
            <Link href="https://netchat-2n7k.vercel.app/">Chat</Link>
          </li>
        <li>
            <Link href="https://www.newtalentsg.co.rw">Read stories</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Net;
