"use client";

import React, { useState, useEffect } from "react";
import styles from "../components/monitor.module.css";
import { db } from "../components/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import emailjs from "@emailjs/browser";

const API_KEY = "d3b627c6d75013b8aaf2aac6de73dcb5";

export default function MonitorPage() {
  const [username, setUsername] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    whatsapp: "",
    email: "",
    reason: "",
    idCard: null,
    profilePhoto: null,
    screenshotStories: null,
    screenshotRefer: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split("; ").find((row) => row.startsWith("username="));
    if (cookies) setUsername(cookies.split("=")[1]);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Upload image kuri ImgBB
  const uploadToImgBB = async (file) => {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (data.success) return data.data.url;
    else throw new Error("ImgBB upload failed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Ohereza amafoto yose kuri ImgBB
      const idCardUrl = formData.idCard ? await uploadToImgBB(formData.idCard) : "";
      const profilePhotoUrl = formData.profilePhoto ? await uploadToImgBB(formData.profilePhoto) : "";
      const screenshotStoriesUrl = formData.screenshotStories ? await uploadToImgBB(formData.screenshotStories) : "";
      const screenshotReferUrl = formData.screenshotRefer ? await uploadToImgBB(formData.screenshotRefer) : "";

      // 2️⃣ Bika muri Firestore
      await addDoc(collection(db, "monetization_requests"), {
        username,
        fullName: formData.fullName,
        whatsapp: formData.whatsapp,
        email: formData.email,
        reason: formData.reason,
        idCardUrl,
        profilePhotoUrl,
        screenshotStoriesUrl,
        screenshotReferUrl,
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Ohereza notification kuri email ya admin
      await emailjs.send(
        "service_fl4f1g4",
        "template_ulyeyn8",
        {
          username,
          fullName: formData.fullName,
          email: formData.email,
          message: `User ${username} yohereje request yo monetize.`,
        },
        "35yUSPlv9GT6X1v5o"
      );

      alert("Request yawe yoherejwe neza!");
      setFormData({
        fullName: "",
        whatsapp: "",
        email: "",
        reason: "",
        idCard: null,
        profilePhoto: null,
        screenshotStories: null,
        screenshotRefer: null,
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Habaye ikibazo mu kohereza request.");
    } finally {
      setLoading(false);
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
          placeholder="Impamvu ya request"
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

        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? "Submitting..." : "Ohereza Request"}
        </button>
      </form>
    </div>
  );
}
