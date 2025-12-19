'use client';

import React, { useState } from "react";
import styles from "../styles/balance.module.css";
import { db } from "../components/firebase";
import { doc, setDoc } from "firebase/firestore";
import Net from "../components/Net";

/* ================= PAGE ================= */
export default function Balance({ username, nes, rwf, status }) {
  const [formData, setFormData] = useState({ fone: "", amount: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fone || !formData.amount) {
      alert("Uzuza neza amakuru yose!");
      return;
    }

    try {
      setSending(true);

      await setDoc(doc(db, "withdrawers", username), {
        username,
        phone: formData.fone,
        nesRequested: Number(formData.amount),
        nesTotal: nes,
        rwfValue: rwf,
        status,
        createdAt: new Date().toISOString(),
      });

      alert("Kubikuza byoherejwe neza!");
      setFormData({ fone: "", amount: "" });
    } catch (err) {
      console.error("Withdraw error:", err);
      alert("Habaye ikibazo mu kubika kubikuza.");
    } finally {
      setSending(false);
    }
  };

  if (!username) {
    return <p className={styles.loading}>Nta username ibonetse.</p>;
  }

  return (
    <div className={styles.container}>
      <Net />

      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.left}>
          <h3>NES: <span>{nes}</span></h3>
          <small>Status: {status}</small>
        </div>
        <div className={styles.right}>
          <h3>RWF: <span>{rwf.toLocaleString()}</span></h3>
        </div>
      </div>

      {/* ===== FORM ===== */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Withdraw Form</h2>

        <label>
          Username:
          <input type="text" value={username} disabled />
        </label>

        <label>
          Phone Number:
          <input
            type="tel"
            value={formData.fone}
            onChange={(e) =>
              setFormData({ ...formData, fone: e.target.value })
            }
            placeholder="Andika numero ya telefone..."
            required
          />
        </label>

        <label>
          NES Ubikuza:
          <input
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="Injiza umubare wa NES..."
            required
          />
        </label>

        <button type="submit" disabled={sending || rwf === 0}>
          {sending ? "Kohereza..." : "Ohereza Kubikuza"}
        </button>

        {rwf === 0 && (
          <p className={styles.warning}>
            Monetization yawe iracyari Pending cyangwa Disabled.
          </p>
        )}
      </form>
    </div>
  );
}

/* ================= SSR ================= */
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/username=([^;]+)/);
  const username = match ? decodeURIComponent(match[1]) : null;

  let nes = 0;
  let rwf = 0;
  let status = "Pending";

  if (username) {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../components/firebase");

      const authorRef = doc(db, "authors", username);
      const snap = await getDoc(authorRef);

      if (snap.exists()) {
        const data = snap.data();
        nes = Number(data.nes || 0);
        status = data.status || "Pending";

        /* ===== FIXED MONETIZATION LOGIC ===== */
        const s = status.toLowerCase().trim();

        // 1️⃣ BANZA UFARE NON-MONETIZED / DISABLED
        if (s.includes("non") || s.includes("disabled")) {
          rwf = nes * 8.34;
        }
        // 2️⃣ HANYUMA MONETIZED / APPROVED
        else if (s.includes("monetized") || s.includes("approved")) {
          rwf = nes * 15;
        }
        // 3️⃣ PENDING / IBINDI
        else {
          rwf = 0;
        }
      }
    } catch (err) {
      console.error("SSR error:", err);
    }
  }

  return {
    props: {
      username,
      nes,
      rwf,
      status,
    },
  };
}
