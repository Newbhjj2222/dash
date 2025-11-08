import React, { useState } from "react";
import { db } from "../components/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cookies from "js-cookie";

export default function LyDashboard({ initialData, username }) {
  const [audios, setAudios] = useState(initialData);

  // Delete audio
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this audio?")) return;

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
      <Header />
      <div className="dashboard-container">
        <h1>My Audio Dashboard</h1>
        {audios.length === 0 && <p>No audios found.</p>}
        {audios.map((audio) => (
          <div key={audio.id} className="audio-card">
            <h2 className="title">{audio.title}</h2>
            <p className="username">By: {audio.username}</p>
            <p className="views">Views: {audio.views || 0}</p>
            <div className="lyrics-preview">
              {audio.lyrics.length > 150
                ? audio.lyrics.substring(0, 150) + "..."
                : audio.lyrics}
            </div>
            <div className="action-buttons">
              <button
                className="delete-btn"
                onClick={() => handleDelete(audio.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Footer />

      <style jsx>{`
        .dashboard-container {
          max-width: 900px;
          margin: 70px auto;
          padding: 0 20px;
        }

        h1 {
          text-align: center;
          margin-bottom: 40px;
        }

        .audio-card {
          background: #f3f4f6;
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .username,
        .views {
          font-size: 0.95rem;
          color: #6b7280;
          margin-bottom: 10px;
        }

        .lyrics-preview {
          font-size: 1rem;
          color: #111827;
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
        }

        .delete-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.2s;
        }

        .delete-btn:hover {
          background: #b91c1c;
        }

        @media (max-width: 600px) {
          .audio-card {
            padding: 15px;
          }

          .title {
            font-size: 1.3rem;
          }

          .lyrics-preview {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </>
  );
}

// SSR: fetch only audios for username in cookies
export async function getServerSideProps(context) {
  // Get username from cookies
  const cookies = context.req.headers.cookie || "";
  const usernameCookie = cookies
    .split("; ")
    .find((c) => c.startsWith("username="));
  const username = usernameCookie ? usernameCookie.split("=")[1] : null;

  if (!username) {
    return {
      redirect: {
        destination: "/login", // redirect if no username cookie
        permanent: false,
      },
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

  return {
    props: {
      initialData,
      username,
    },
  };
}
