import React, { useState, useRef } from "react";
import { db } from "../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import Cookies from "js-cookie";

export default function LyricsPage({ usernameFromServer }) {
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const lyricsRef = useRef(null);

  // 🔼 Upload audio kuri Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default"); // preset yawe ya Cloudinary

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dilowy3fd/video/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.secure_url;
  };

  // 💾 Kubika lyrics & audio muri Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const username =
        Cookies.get("username") || usernameFromServer || "anonymous";
      const lyrics = lyricsRef.current.innerText.trim();

      if (!lyrics) {
        setMessage("⚠️ Andika lyrics mbere yo kubika.");
        setLoading(false);
        return;
      }

      let audioUrl = null;
      if (audio) {
        audioUrl = await uploadToCloudinary(audio);
      }

      await addDoc(collection(db, "lyrics"), {
        username,
        lyrics,
        audioUrl,
        createdAt: new Date(),
      });

      lyricsRef.current.innerText = "";
      setAudio(null);
      setMessage("✅ Lyrics na audio byoherejwe neza!");
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Habaye ikibazo mu kubika!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lyrics-container">
      <h1 className="title">Upload Lyrics & Audio</h1>

      <form className="lyrics-form" onSubmit={handleSubmit}>
        <div
          ref={lyricsRef}
          className="lyrics-input"
          contentEditable
          suppressContentEditableWarning={true}
          placeholder="Andika lyrics hano..."
        ></div>

        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setAudio(e.target.files[0])}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Bika Lyrics"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <style jsx>{`
        .lyrics-container {
          max-width: 600px;
          margin: 80px auto;
          padding: 25px;
          border-radius: 16px;
          background: #f9fafb;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: #111827;
        }
        .lyrics-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .lyrics-input {
          width: 100%;
          min-height: 160px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 1rem;
          background-color: #fff;
          text-align: left;
          overflow-y: auto;
          white-space: pre-wrap;
        }
        .lyrics-input:empty:before {
          content: attr(placeholder);
          color: #9ca3af;
        }
        input[type="file"] {
          background: #fff;
          border: 1px solid #d1d5db;
          padding: 10px;
          border-radius: 10px;
        }
        button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s;
        }
        button:hover {
          background-color: #1e40af;
        }
        .message {
          margin-top: 15px;
          font-size: 0.95rem;
          color: #047857;
        }
        @media (max-width: 600px) {
          .lyrics-container {
            margin: 30px 10px;
            padding: 15px;
          }
          .lyrics-input {
            min-height: 140px;
          }
        }
      `}</style>
    </div>
  );
}

// ✅ Server-Side Rendering (SSR)
export async function getServerSideProps(context) {
  const usernameFromServer = context.req.cookies.username || null;
  return {
    props: { usernameFromServer },
  };
}
