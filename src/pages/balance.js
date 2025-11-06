import React, { useState } from "react";
import styles from "../styles/balance.module.css";
import { db } from "../components/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Net from "../components/Net";

// 🔹 Page Component
export default function Balance({ username, nes }) {
  const [formData, setFormData] = useState({ fone: "", amount: "" });
  const [sending, setSending] = useState(false);
  const rwf = nes * 13;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fone || !formData.amount) {
      alert("Uzuza neza amakuru yose!");
      return;
    }

    try {
      setSending(true);
      await setDoc(doc(db, "withdrawers", username), {
  ame: username,
  fone: formData.fone,
  amount: formData.amount,
  date: new Date().toISOString(),
});
      alert("Ibyo wabikuje byoherejwe neza!");
      setFormData({ fone: "", amount: "" });
    } catch (err) {
      console.error("Error saving withdraw request:", err);
      alert("Habaye ikosa mukubika ibyo wabikuje.");
    } finally {
      setSending(false);
    }
  };

  if (!username) {
    return <p className={styles.loading}>No username found in cookies.</p>;
  }

  return (
    <div className={styles.container}>
    <Net />
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.left}>
          <h3>NES: <span>{nes}</span></h3>
        </div>
        <div className={styles.right}>
          <h3>RWF: <span>{rwf.toLocaleString()}</span></h3>
        </div>
      </div>

      {/* Form */}
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
            name="fone"
            value={formData.fone}
            onChange={(e) => setFormData({ ...formData, fone: e.target.value })}
            placeholder="Andika numero ya telefone..."
            required
          />
        </label>

        <label>
          NES Ubikuza:
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="Injiza umubare wa NES ushaka kubikuza..."
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

// 🔹 Server Side Rendering (SSR)
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/username=([^;]+)/);
  const username = match ? decodeURIComponent(match[1]) : null;

  let nes = 0;

  if (username) {
    try {
      const { getFirestore, doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../components/firebase");
      const docRef = doc(db, "authors", username);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        nes = snap.data().nes || 0;
      }
    } catch (err) {
      console.error("Error fetching data from Firestore:", err);
    }
  }

  return {
    props: {
      username,
      nes,
    },
  };
}
