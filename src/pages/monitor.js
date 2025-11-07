"use client";

import React, { useState, useEffect } from "react";
import styles from "../components/monitor.module.css";
import { db } from "../components/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import emailjs from "@emailjs/browser";

export default function MonitorPage() {
  const [username, setUsername] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    whatsapp: "",
    email: "",
    idCard: "",
    profilePhoto: "",
    screenshotStories: "",
    screenshotRefer: "",
    reason: "",
  });

  useEffect(() => {
    // Fata username muri cookies
    const cookies = document.cookie.split("; ").find((row) => row.startsWith("username="));
    if (cookies) setUsername(cookies.split("=")[1]);
  }, []);

  // Guhindura input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Kohereza form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1️⃣ Banza ubike muri Firestore
      await addDoc(collection(db, "monetization_requests"), {
        username,
        ...formData,
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Noneho wohereze kuri email ya admin
      await emailjs.send(
        "service_fl4f1g4",
        "template_ulyeyn8",
        {
          from_name: formData.fullName,
          from_email: formData.email,
          whatsapp: formData.whatsapp,
          username,
          reason: formData.reason,
          message: `User ${username} yohereje request yo kuri monetize.`,
          idCard: formData.idCard,
          profilePhoto: formData.profilePhoto,
          screenshotStories: formData.screenshotStories,
          screenshotRefer: formData.screenshotRefer,
          to_email: "admin@newtalentsg.co.rw",
        },
        "35yUSPlv9GT6X1v5o"
      );

      alert("Request yawe yoherejwe neza!");
      setFormData({
        fullName: "",
        whatsapp: "",
        email: "",
        idCard: "",
        profilePhoto: "",
        screenshotStories: "",
        screenshotRefer: "",
        reason: "",
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Habaye ikibazo mu kohereza request.");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Monetization Request Form</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="Amazina yawe bwite"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="whatsapp"
          placeholder="Numero ya WhatsApp"
          value={formData.whatsapp}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email yawe"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <textarea
          name="reason"
          placeholder="Icyo wifuza cyangwa impamvu ya request"
          value={formData.reason}
          onChange={handleChange}
          rows="3"
          required
        ></textarea>

        <label className={styles.label}>Ifoto y’indangamuntu:</label>
        <input type="file" name="idCard" accept="image/*" onChange={handleChange} required />

        <label className={styles.label}>Ifoto yawe bwite:</label>
        <input type="file" name="profilePhoto" accept="image/*" onChange={handleChange} required />

        <label className={styles.label}>Screenshot y’inkuru wanditse:</label>
        <input type="file" name="screenshotStories" accept="image/*" onChange={handleChange} required />

        <label className={styles.label}>Screenshot ya reffer program:</label>
        <input type="file" name="screenshotRefer" accept="image/*" onChange={handleChange} required />

        <button type="submit" className={styles.submitButton}>
          Ohereza Request
        </button>
      </form>
    </div>
  );
}
