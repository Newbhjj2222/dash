"use client";
import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { db } from "../components/firebase"; // Firebase yawe
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "../components/monitor.module.css";

export default function Monitor() {
  const [username, setUsername] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    whatsapp: "",
    email: "",
    idCard: "",
    photo: "",
    screenshotStories: "",
    screenshotStats: "",
    requestNote: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Fata username muri cookies
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const userCookie = cookies.find((row) => row.startsWith("username="));
    if (userCookie) setUsername(userCookie.split("=")[1]);
  }, []);

  // Gusoma amafoto / screenshots nka base64
  const handleFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, [e.target.name]: reader.result });
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Bika amakuru yose muri Firestore
      await addDoc(collection(db, "monetization_requests"), {
        username,
        ...form,
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Ohereza notification kuri email yawe ukoresheje EmailJS
      await emailjs.send(
        "service_fl4f1g4", // Service ID
        "template_ulyeyn8", // Template ID
        {
          username,
          fullName: form.fullName,
          email: form.email,
        },
        "35yUSPlv9GT6X1v5o" // Public Key
      );

      setSent(true);
      setForm({
        fullName: "",
        whatsapp: "",
        email: "",
        idCard: "",
        photo: "",
        screenshotStories: "",
        screenshotStats: "",
        requestNote: "",
      });
    } catch (error) {
      console.error("❌ Error submitting request:", error);
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Monetization Request</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.username}>
          Logged in as: <b>{username || "Unknown"}</b>
        </p>

        <label>Full Name</label>
        <input
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          required
        />

        <label>WhatsApp Number</label>
        <input
          type="text"
          name="whatsapp"
          value={form.whatsapp}
          onChange={handleChange}
          required
        />

        <label>Email Address</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>ID Card (Image)</label>
        <input type="file" name="idCard" accept="image/*" onChange={handleFile} required />

        <label>Your Photo</label>
        <input type="file" name="photo" accept="image/*" onChange={handleFile} required />

        <label>Screenshot - Stories Stats</label>
        <input type="file" name="screenshotStories" accept="image/*" onChange={handleFile} required />

        <label>Screenshot - Referral Stats</label>
        <input type="file" name="screenshotStats" accept="image/*" onChange={handleFile} required />

        <label>Additional Notes / Request Reason</label>
        <textarea
          name="requestNote"
          value={form.requestNote}
          onChange={handleChange}
          placeholder="Explain your monetization request..."
        ></textarea>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Request"}
        </button>

        {sent && <p className={styles.success}>✅ Request submitted successfully!</p>}
      </form>
    </div>
  );
}
