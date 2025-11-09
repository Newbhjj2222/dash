import React, { useState } from "react";
import { db } from "../components/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import Net from "../components/Net";
import Cookies from "js-cookie";
import styles from "../styles/ly.module.css"; // <-- import CSS module

export default function LyDashboard({ initialData, username }) {
  const [audios, setAudios] = useState(initialData);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this audio?")) return;

    try {
      await deleteDoc(doc(db, "lyrics", id));
      setAudios((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting audio:", error);
      alert("Failed to delete audio.");
    }
  };

  return (
    <>
      <Net />
      <div className={styles.dashboardContainer}>
        <h1>My Audio Dashboard</h1>

        {audios.length === 0 && <p>No audios found.</p>}

        {audios.map((audio) => (
          <div key={audio.id} className={styles.audioCard}>
            <h2 className={styles.title}>{audio.title}</h2>
            <p className={styles.username}>By: {audio.username}</p>
            <p className={styles.views}>Views: {audio.views || 0}</p>
            <div className={styles.lyricsPreview}>
              {audio.lyrics.length > 150
                ? audio.lyrics.substring(0, 150) + "..."
                : audio.lyrics}
            </div>
            <div className={styles.actionButtons}>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(audio.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// SSR: fetch only audios for username in cookies
export async function getServerSideProps(context) {
  const cookies = context.req.headers.cookie || "";
  const usernameCookie = cookies.split("; ").find((c) => c.startsWith("username="));
  const username = usernameCookie
    ? decodeURIComponent(usernameCookie.split("=")[1])
    : null;

  if (!username) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  let initialData = [];

  try {
    const q = query(collection(db, "lyrics"), where("username", "==", username));
    const snapshot = await getDocs(q);
    initialData = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }

  return { props: { initialData, username } };
}
