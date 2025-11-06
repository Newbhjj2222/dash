'use client';
import React, { useState, useEffect } from "react";
import styles from "@/styles/profile.module.css";
import Net from "@/components/Net";
import { db } from "@/components/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FaCamera, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Profile({ userData, authorData }) {
  const router = useRouter();
  const [fname, setFname] = useState(userData?.fname || "");
  const [photo, setPhoto] = useState(userData?.photo || "");
  const [editing, setEditing] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setPhoto(base64String);

      // update photo in Firestore
      const userRef = doc(db, "userdate", userData.username);
      await updateDoc(userRef, { photo: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = async () => {
    const userRef = doc(db, "userdate", userData.username);
    await updateDoc(userRef, { fname });
    setEditing(false);
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

          <h2 className={styles.username}>{userData.username}</h2>

          <div className={styles.infoSection}>
            <label>Full Name:</label>
            {editing ? (
              <div className={styles.editField}>
                <input
                  type="text"
                  value={Fname}
                  onChange={(e) => setFname(e.target.value)}
                  className={styles.inputBox}
                />
                <button onClick={handleNameChange} className={styles.saveBtn}>
                  Save
                </button>
              </div>
            ) : (
              <p onClick={() => setEditing(true)} className={styles.editableText}>
                {fname || "Click to add name"}
              </p>
            )}
          </div>

          <div className={styles.infoSection}>
            <label>Monitization Status:</label>
            <p className={styles.status}>
              {authorData?.monitizationStatus || "Pending"}
            </p>
          </div>

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
  const authorRef = doc(db, "authors", username);
  const authorSnap = await getDoc(authorRef);

  const userData = userSnap.exists() ? userSnap.data() : {};
  const authorData = authorSnap.exists() ? authorSnap.data() : {};

  return { props: { userData: { ...userData, username }, authorData } };
}
