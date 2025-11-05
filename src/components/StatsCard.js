import React from "react";
import styles from "./StatsCard.module.css";

const StatsCard = ({ title, value }) => {
  return (
    <div className={styles.card}>
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
};

export default StatsCard;
