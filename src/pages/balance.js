'use client';

import React, { useEffect, useState } from "react";
import styles from "../styles/balance.module.css"; // shyira aho CSS iri
import { db } from "../components/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// 👉 Fungura cookies function
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

export default function Balance() {
  const [nes, setNes] = useState(0);
  const [username, setUsername] = useState("");
  const [formData, setFormData] = useState({ fone: "", amount: "" });
  const [loading, setLoading] = useState(true);

  // ✅ Fata username muri cookies hanyuma usome document muri Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = getCookie("username"); // 👈 username iba muri cookies
        if (!user) {
          alert("Username ntiyabonetse muri cookies.");
          setLoading(false);
          return;
        }

        setUsername(user);
        const docRef = doc(db, "authors", user);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          setNes(data.nes || 0);
        } else {
          setNes(0);
        }
      } catch (err) {
        console.error("Error fetching NES:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const rwf = nes * 13;

  // ✅ Kubika muri withdrawers collection (doc id = username)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fone || !formData.amount) {
      alert("Uzuza neza amakuru yose!");
      return;
    }

    try {
      await setDoc(doc(db, "withdrawers", username), {
        username: username,
        fone: formData.fone,
        amount: formData.amount,
        date: new Date().toISOString(),
      });
      alert("Ibyo wabikuje byoherejwe neza!");
      setFormData({ fone: "", amount: "" });
    } catch (err) {
      console.error("Error saving withdraw request:", err);
      alert("Habaye ikosa mukubika ibyo wabikuje.");
    }
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.left}>
          <h3>NES: <span>{nes}</span></h3>
        </div>
        <div className={styles.right}>
          <h3>RWF: <span>{rwf.toLocaleString()}</span></h3>
        </div>
      </div>

      {/* Form yo kubikuza */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Withdraw Form</h2>

        <label>
          Username:
          <input
            type="text"
            value={username}
            disabled
          />
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

        <button type="submit">Ohereza Kubikuza</button>
      </form>
    </div>
  );
}
