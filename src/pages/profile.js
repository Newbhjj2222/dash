'use client';
import React, { useState } from "react";
import styles from "@/styles/profile.module.css";
import Net from "@/components/Net";
import { db } from "@/components/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { FaCamera, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Profile({ userData, status }) {
  const router = useRouter();
  const [fname, setFname] = useState(userData?.FName || "");
  const [photo, setPhoto] = useState(userData?.photo || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [feedback, setFeedback] = useState("");
  const [editingName, setEditingName] = useState(false);

  const username = userData?.username;

  const showFeedback = (msg, success = true) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setPhoto(base64String);

      try {
        const userRef = doc(db, "userdate", username);
        await updateDoc(userRef, { photo: base64String });
        showFeedback("Profile photo updated successfully!");
      } catch (err) {
        console.error(err);
        showFeedback("Error updating photo!", false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = async () => {
    if (!fname.trim()) return showFeedback("Full Name cannot be empty.", false);

    try {
      const userRef = doc(db, "userdate", username);
      await updateDoc(userRef, { FName: fname });
      setEditingName(false);
      showFeedback("Full Name updated successfully!");
    } catch (err) {
      console.error(err);
      showFeedback("Error updating Full Name!", false);
    }
  };

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
                type="file"
                id="fileInput"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
            </label>
          </div>

          <h2 className={styles.username}>{username}</h2>

          <div className={styles.infoSection}>
            <label>Full Name:</label>
            {editingName ? (
              <div className={styles.editField}>
                <input
                  type="text"
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                  className={styles.inputBox}
                />
                <button onClick={handleNameChange} className={styles.saveBtn}>
                  Save
                </button>
              </div>
            ) : (
              <p
                onClick={() => setEditingName(true)}
                className={styles.editableText}
              >
                {fname || "Click to add full name"}
              </p>
            )}
          </div>

          <div className={styles.infoSection}>
            <label>Email:</label>
            <p>{email || "Not set"}</p>
          </div>

          <div className={styles.infoSection}>
            <label>Monitization Status:</label>
            <p className={styles.status}>{status}</p>
          </div>

          {feedback && (
            <div
              className={feedback.includes("Error") ? styles.errorFeedback : styles.feedback}
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

export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const usernameMatch = cookie.match(/username=([^;]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;

  if (!username) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const userRef = doc(db, "userdate", username);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const defaultData = { username, FName: "", email: "", photo: "" };
    await setDoc(userRef, defaultData);
  }

  const userData = userSnap.exists() ? userSnap.data() : { username, FName: "", email: "", photo: "" };

  const authorRef = doc(db, "authors", username);
  const authorSnap = await getDoc(authorRef);
  const status = authorSnap.exists() ? authorSnap.data().status : "Pending";

  return { props: { userData: { ...userData, username }, status } };
}
