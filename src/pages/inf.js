'use client';

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { FaUser } from "react-icons/fa";

export default function Netinf() {
  const [level, setLevel] = useState("low");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const cookieLevel = Cookies.get("userLevel");
    if (cookieLevel) setLevel(cookieLevel);

    let targetProgress = 0;
    if (cookieLevel === "low") targetProgress = 33;
    else if (cookieLevel === "middle") targetProgress = 66;
    else if (cookieLevel === "high") targetProgress = 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= targetProgress) {
          clearInterval(interval);
          return targetProgress;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const getColor = () => {
    if (level === "low") return "#f87171"; // red
    if (level === "middle") return "#facc15"; // yellow
    if (level === "high") return "#34d399"; // green
    return "#ccc";
  };

  const getBadgeStyle = () => {
    if (level === "low") return { backgroundColor: "#f87171" };
    if (level === "middle") return { backgroundColor: "#facc15", color: "#000" };
    if (level === "high") return { backgroundColor: "#34d399" };
    return {};
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <FaUser size={32} />
        <h1>User Level</h1>
        <span style={{
          padding: "0.3rem 0.8rem",
          borderRadius: "12px",
          color: "#fff",
          fontWeight: "bold",
          ...getBadgeStyle()
        }}>
          {level.toUpperCase()}
        </span>
      </div>

      <div style={{
        marginTop: "1rem",
        width: "100%",
        height: "30px",
        backgroundColor: "#e5e7eb",
        borderRadius: "5px",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          backgroundColor: getColor(),
          transition: "width 0.3s ease"
        }} />
      </div>

      <p style={{ marginTop: "1rem" }}>Progress: {progress}%</p>
    </div>
  );
}
