'use client';
import React, { useState } from "react";
import styles from "@/styles/profile.module.css";
import Net from "@/components/Net";
import { db } from "@/components/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FaCamera, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Profile({ username, userData, layID, status }) {
  const router = useRouter();
  const [photo, setPhoto] = useState(userData?.photo || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [feedback, setFeedback] = useState("");

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
        const userRef = doc(db, "userdate", "data");
        await updateDoc(userRef, { [`${layID}.photo`]: base64String });
        showFeedback("Profile photo updated successfully!");
      } catch (err) {
        console.error(err);
        showFeedback("Error updating photo!", false);
      }
    };
    reader.readAsDataURL(file);
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
            <label>Email:</label>
            <p>{email || "Not set"}</p>
          </div>

          <div className={styles.infoSection}>
            <label>Monetization Status:</label>
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

  // Fetch document "data"
  const userRef = doc(db, "userdate", "data");
  const userSnap = await getDoc(userRef);
  let userData = null;
  let layID = null;

  if (userSnap.exists()) {
    const data = userSnap.data();
    // Shaka layID aho fName = username
    for (const key in data) {
      if (data[key].fName === username) {
        layID = key;
        userData = data[key];
        break;
      }
    }
  }

  if (!userData) {
    // Niba user idahari, shyiramo default
    const defaultLayID = `lay_${Date.now()}`;
    const defaultData = { fName: username, email: "", photo: "" };
    await updateDoc(userRef, { [defaultLayID]: defaultData }).catch(async () => {
      await setDoc(userRef, { [defaultLayID]: defaultData });
    });
    layID = defaultLayID;
    userData = defaultData;
  }

  // Fetch monetization status
  const authorRef = doc(db, "authors", username);
  const authorSnap = await getDoc(authorRef);
  const status = authorSnap.exists() ? authorSnap.data().status : "Pending";

  return { props: { username, userData, layID, status } };
}
