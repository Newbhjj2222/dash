'use client';

import React, { useState } from "react";
import styles from "../styles/balance.module.css";
import { db } from "../components/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Net from "../components/Net";

export default function Balance({ username, nes, rwf, status }) {
  const [formData, setFormData] = useState({ phone: "", amount: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phone || !formData.amount) {
      alert("Uzuza neza amakuru yose!");
      return;
    }

    if (Number(formData.amount) <= 0) {
      alert("Injiza NES ifite agaciro.");
      return;
    }

    try {
      setSending(true);

      await setDoc(doc(db, "withdrawers", username), {
        username: username,
        phone: formData.phone,
        nesRequested: Number(formData.amount),
        nesTotal: Number(nes),
        rwfValue: Number(rwf),
        status: status,
        withdrawStatus: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Kubikuza byoherejwe neza!");
      setFormData({ phone: "", amount: "" });
    } catch (err) {
      console.error("Error saving withdraw request:", err);
      alert("Habaye ikibazo mukubika ibyo wabikuje.");
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

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.left}>
          <h3>NES: <span>{nes}</span></h3>
          <small>Status: {status}</small>
        </div>
        <div className={styles.right}>
          <h3>RWF: <span>{rwf.toLocaleString()}</span></h3>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Withdraw Form</h2>

        <label>
          Username
          <input type="text" value={username} disabled />
        </label>

        <label>
          Phone Number
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Andika numero ya telefone"
            required
          />
        </label>

        <label>
          NES Ubikuza
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="Injiza NES ushaka kubikuza"
            required
          />
        </label>

        <button type="submit" disabled={sending}>
          {sending ? "Kohereza..." : "Ohereza Kubikuza"}
        </button>
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

      const ref = doc(db, "authors", username);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        nes = Number(data.nes || 0);
        status = data.status || "Pending";

        const s = status.toLowerCase().trim();

        if (s.includes("non") || s.includes("disabled")) {
          rwf = nes * 8.34;
        } else if (s.includes("monetized") || s.includes("approved")) {
          rwf = nes * 15;
        } else {
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
