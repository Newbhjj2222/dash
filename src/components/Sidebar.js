import React from "react";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <h3 className={styles.title}>Dashboard</h3>
      <ul className={styles.menu}>
        <li>🏠 Home</li>
        <li>✍️ My Posts</li>
        <li>📊 Stats</li>
        <li>⚙️ Settings</li>
      </ul>
    </div>
  );
};

export default Sidebar;
