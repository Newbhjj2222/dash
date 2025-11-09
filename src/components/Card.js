import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function NesValueCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "60px",
        borderRadius: "10px",
        background: "linear-gradient(90deg, #6a11cb, #2575fc)",
        display: "flex",
        alignItems: "center",
        margin: "10px",
        justifyContent: "space-between",
        padding: "0 20px",
        color: "#fff",
        fontWeight: "bold",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      {/* Animation Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-50%",
          width: "200%",
          height: "100%",
          background: "linear-gradient(120deg, rgba(255,255,255,0.2), rgba(255,255,255,0) 70%)",
          transform: "skewX(-25deg)",
          animation: "shine 2s infinite",
        }}
      ></div>

      <style jsx>{`
        @keyframes shine {
          0% {
            left: -50%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ position: "absolute", width: "100%", textAlign: "center", top: "50%", transform: "translateY(-50%)" }}>
        VALUE OF NES POINT
      </div>

      {/* Now */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", zIndex: 1 }}>
        <FaArrowUp /> Now: 13 RWF / 1 Nes
      </div>

      {/* Upcoming */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", zIndex: 1 }}>
        <FaArrowDown /> Upcoming: 15 RWF / 1 Nes
      </div>
    </div>
  );
}
