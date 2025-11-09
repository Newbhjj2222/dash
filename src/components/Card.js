import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function NesValueCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "60px",
        borderRadius: "8px",
        background: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "16px",
        padding: "0 20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        animation: "pulse 2s infinite alternate",
      }}
    >
      <style jsx>{`
        @keyframes pulse {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span>Value of Nes point</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaArrowUp />
          <span>Now: 13 RWF / 1 Nes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaArrowDown />
          <span>Upcoming: 15 RWF / 1 Nes</span>
        </div>
      </div>
    </div>
  );
}
