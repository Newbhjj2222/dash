import React from "react";
import { FaSyncAlt } from "react-icons/fa";
import Net from "../components/Net";

export default function IndexPage() {
  return (
    <div style={styles.container}>
    <Net />
      <div style={styles.box}>
        
        <FaSyncAlt style={{ ...styles.icon, animation: "spin 1.5s linear infinite" }} />
        <h2 style={styles.text}>Page iri kuvugururwa...</h2>
        <p style={styles.subtext}>Irasubira online vuba 🔄</p>
      </div>

      {/* CSS animation definition (safe for Next.js) */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "linear-gradient(135deg, #001f3f, #0074d9)",
    color: "white",
    fontFamily: "Poppins, sans-serif",
    textAlign: "center",
  },
  box: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 15,
    padding: "30px 25px",
    borderRadius: 20,
    background: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0 0 15px rgba(0,0,0,0.3)",
    backdropFilter: "blur(6px)",
  },
  icon: {
    fontSize: 40,
    color: "#ffcc00",
  },
  text: {
    fontSize: "1.5rem",
    fontWeight: 600,
    margin: 0,
  },
  subtext: {
    fontSize: "1rem",
    opacity: 0.85,
  },
};
