import React, { useState, useRef } from "react";
import { db } from "../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import Net from "../components/Net";

export default function LyricsPage({ usernameFromServer }) {
  const [title, setTitle] = useState("");
  const [audio, setAudio] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null); // <-- preview
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const lyricsRef = useRef(null);

  // Upload audio kuri Cloudinary (preset audiomp3)
  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "audiomp3"); // preset unsigned

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dilowy3fd/video/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Cloudinary upload failed");
      }
      return data.secure_url;
    } catch (err) {
      throw new Error(`Cloudinary Error: ${err.message}`);
    }
  };

  // Kubika muri Firestore
  const saveToFirestore = async (data) => {
    try {
      await addDoc(collection(db, "lyrics"), data);
    } catch (err) {
      throw new Error(`Firestore Error: ${err.message}`);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorDetail("");

    try {
      const username =
        Cookies.get("username") || usernameFromServer || "anonymous";
      const lyrics = lyricsRef.current.innerText.trim();

      if (!title.trim()) throw new Error("Andika title y'indirimbo mbere yo kubika.");
      if (!lyrics) throw new Error("Andika lyrics mbere yo kubika.");

      let audioUrl = null;
      if (audio) audioUrl = await uploadToCloudinary(audio);

      await saveToFirestore({
        username,
        title,
        lyrics,
        audioUrl,
        createdAt: new Date(),
      });

      // Reset inputs
      setTitle("");
      lyricsRef.current.innerText = "";
      setAudio(null);
      setAudioPreview(null);
      setMessage("✅ Lyrics na audio byoherejwe neza!");
    } catch (error) {
      console.error("Detailed Error:", error);
      setMessage("❌ Habaye ikibazo mu kubika!");
      setErrorDetail(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file select & preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudio(file);
      setAudioPreview(URL.createObjectURL(file)); // <-- create preview
    } else {
      setAudio(null);
      setAudioPreview(null);
    }
  };

  return (
    <>
    <Net />
    <div className="lyrics-container">
      <h1 className="title">Upload Lyrics & Audio</h1>

      <form className="lyrics-form" onSubmit={handleSubmit}>
        {/* TITLE */}
        <input
          type="text"
          value={title}
          placeholder="Injiza title y'indirimbo..."
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
        />

        {/* LYRICS */}
        <div
          ref={lyricsRef}
          className="lyrics-input"
          contentEditable
          suppressContentEditableWarning={true}
          placeholder="Andika lyrics hano..."
        ></div>

        {/* AUDIO */}
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
        />

        {/* AUDIO PREVIEW */}
        {audioPreview && (
          <audio controls src={audioPreview} className="audio-preview"></audio>
        )}

        {/* BUTTON */}
        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Bika Lyrics"}
        </button>
      </form>

      {/* MESSAGES */}
      {message && <p className="message">{message}</p>}
      {errorDetail && <p className="error-detail">{errorDetail}</p>}

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

        .title-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 1rem;
          background-color: #fff;
        }

        .lyrics-input {
          width: 100%;
          max-height: 160px;
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

        .audio-preview {
          margin-top: 10px;
          width: 100%;
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

        .error-detail {
          margin-top: 10px;
          font-size: 0.9rem;
          color: #dc2626;
          background: #fee2e2;
          padding: 10px;
          border-radius: 8px;
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
        </>
  );
}

// SSR
export async function getServerSideProps(context) {
  const usernameFromServer = context.req.cookies.username || null;
  return { props: { usernameFromServer } };
}
