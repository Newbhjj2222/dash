'use client';
import React from "react";
import styles from "../styles/monitize.module.css";
import Net from "../components/Net"; // ✅ Shyiramo header component
import { FaTools } from "react-icons/fa"; // React icon yo kugaragaza “under construction”

export default function Monitize() {
  return (
    <div>
      {/* Header */}
      <Net />

      {/* Main content */}
      <div className={styles.container}>
        <div className={styles.card}>
          <FaTools className={styles.icon} />
          <h1>System Monitization</h1>
          <p>This page of system monitization is under construction.</p>
          <h3>🚧 Coming Soon 🚧</h3>
        </div>
      </div>
    </div>
  );
}
