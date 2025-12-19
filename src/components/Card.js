import React from "react";
import { FaArrowUp, FaArrowDown, FaArrowRight } from "react-icons/fa";

export default function NesValueCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "80px",
        borderRadius: "10px",
        background: "linear-gradient(90deg, #6a11cb, #2575fc)",
        display: "flex",
        margin: "10px",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: "10px 20px",
        color: "#fff",
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
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>

      {/* Header */}
      <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>
        VALUE OF NES POINT
      </div>

      {/* Values */}
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1,
        fontSize: "14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaArrowRight /> Non: 8.34 RWF / 1 Nes
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <FaArrowUp /> Moni: 15 RWF / 1 Nes
        </div>
      </div>
    </div>
  );
}
