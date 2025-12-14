'use client';

import React, { useState } from "react";
import styles from "@/styles/profile.module.css";
import Net from "@/components/Net";
import { db } from "@/components/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { FaCamera, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

/* ----------------- USERNAME SANITIZER ----------------- */
const sanitizeUsername = (value = "") => {
  try {
    let name = decodeURIComponent(value); // %20 -> space
    name = name
      .replace(/[^a-zA-Z0-9\s]/g, "") // kuramo %, $, @, +, n'ibindi
      .replace(/\s+/g, " ")           // space nyinshi -> imwe
      .trim();                        // kuramo space ku mpera
    return name;
  } catch {
    return value.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  }
};

export default function Profile({ username, userData, layID, status }) {
  const router = useRouter();
  const [photo, setPhoto] = useState(userData?.photo || "");
  const [email] = useState(userData?.email || "");
  const [feedback, setFeedback] = useState("");

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  /* ----------------- IMAGE UPLOAD ----------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setPhoto(base64);

      try {
        const userRef = doc(db, "userdate", "data");
        await updateDoc(userRef, {
          [`${layID}.photo`]: base64,
        });
        showFeedback("Profile photo updated successfully!");
      } catch (err) {
        console.error(err);
        showFeedback("Error updating photo!");
      }
    };
    reader.readAsDataURL(file);
  };

  /* ----------------- LOGOUT ----------------- */
  const handleLogout = () => {
    Cookies.remove("username");
    router.push("/login");
  };

  return (
    <>
      <Net />

      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.profilePicContainer}>
            {photo ? (
              <img src={photo} alt="Profile" className={styles.profilePic} />
            ) : (
              <FaUserCircle className={styles.defaultIcon} />
            )}

            <label htmlFor="fileInput" className={styles.cameraIcon}>
              <FaCamera />
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
            </label>
          </div>

          <h2 className={styles.username}>{username}</h2>

          <div className={styles.infoSection}>
            <label>Email:</label>
            <p>{email || "Not set"}</p>
          </div>

          <div className={styles.infoSection}>
            <label>Monetization Status:</label>
            <p className={styles.status}>{status}</p>
          </div>

          {feedback && (
            <div
              className={
                feedback.toLowerCase().includes("error")
                  ? styles.errorFeedback
                  : styles.feedback
              }
            >
              {feedback}
            </div>
          )}

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </>
  );
}

/* ================= SERVER SIDE ================= */
export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const match = cookie.match(/username=([^;]+)/);

  if (!match) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const rawUsername = match[1];
  const username = sanitizeUsername(rawUsername);

  const userRef = doc(db, "userdate", "data");
  const userSnap = await getDoc(userRef);

  let userData = null;
  let layID = null;

  /* -------- FIND USER -------- */
  if (userSnap.exists()) {
    const data = userSnap.data();

    for (const key in data) {
      if (sanitizeUsername(data[key].fName) === username) {
        layID = key;
        userData = data[key];
        break;
      }
    }
  }

  /* -------- CREATE DEFAULT IF NOT FOUND -------- */
  if (!userData) {
    const defaultLayID = `lay_${Date.now()}`;
    const defaultData = {
      fName: username,
      email: "",
      photo: "",
    };

    try {
      await updateDoc(userRef, { [defaultLayID]: defaultData });
    } catch {
      await setDoc(userRef, { [defaultLayID]: defaultData }, { merge: true });
    }

    layID = defaultLayID;
    userData = defaultData;
  }

  /* -------- MONETIZATION STATUS -------- */
  const authorRef = doc(db, "authors", username);
  const authorSnap = await getDoc(authorRef);
  const status = authorSnap.exists()
    ? authorSnap.data().status
    : "Pending";

  return {
    props: {
      username,
      userData,
      layID,
      status,
    },
  };
    }
