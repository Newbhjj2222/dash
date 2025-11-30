'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { app } from "@/components/firebase";
import styles from "@/styles/create.module.css";
import Net from "../components/Net";
import Folder from "@/components/Folder";

export default function CreateStoryPage() {
  const db = getFirestore(app);
  const router = useRouter();

  // 🟩 STATES
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [head, setHead] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryPreview, setCategoryPreview] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState("");
  const [season, setSeason] = useState("S01");
  const [fromEp, setFromEp] = useState(1);
  const [toEp, setToEp] = useState(1);
  const [episodesContent, setEpisodesContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🟢 SSR - Fata username muri cookies
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const userCookie = cookies.find((row) => row.startsWith("username="));
    if (userCookie) {
      const value = userCookie.split("=")[1];
      setUsername(decodeURIComponent(value));
    } else {
      router.push("/login");
    }
  }, [router]);

  // 🟢 SSR - Fata folders z'umukoresha
  useEffect(() => {
    if (!username) return;
    const fetchFolders = async () => {
      try {
        const qSnap = await getDocs(collection(db, "folders"));
        const userFolders = [];
        qSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.author === username) {
            userFolders.push({ id: docSnap.id, title: data.title });
          }
        });
        setFolders(userFolders);
      } catch (err) {
        console.error("Error fetching folders:", err);
        setErrorMessage("Ntibyakunze gufata folders: " + err.message);
      }
    };
    fetchFolders();
  }, [username, db]);

  // 🟢 Handle Image File
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 🟢 Step 1 handler
  const handleStep1 = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!head || !folder || categories.length === 0 || !imageFile) {
      setErrorMessage("Wuzuza amakuru yose!");
      return;
    }
    if (fromEp > toEp) {
      setErrorMessage("From ntigomba kurenza To!");
      return;
    }

    const total = toEp - fromEp + 1;
    setEpisodesContent(Array.from({ length: total }, () => ""));
    setStep(2);
  };

  // 🟢 Step 2 handler — Upload Image + Bika muri Firestore
  const handleStep2 = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (episodesContent.some((ep) => !ep.trim())) {
      setErrorMessage("Andika content ya buri episode!");
      return;
    }

    if (!imageFile) {
      setErrorMessage("Ntufite ifoto wahisemo!");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Upload image to ImgBB
      const API_KEY = "d3b627c6d75013b8aaf2aac6de73dcb5";
      const formData = new FormData();
      formData.append("image", imageFile);

      const uploadResponse = await fetch(
        `https://api.imgbb.com/1/upload?key=${API_KEY}`,
        { method: "POST", body: formData }
      );

      const uploadData = await uploadResponse.json();
      if (!uploadData.success) {
        throw new Error("Error uploading image to ImgBB");
      }

      const uploadedImageUrl = uploadData.data.url;

      // 2️⃣ Save all episodes to Firestore
      const promises = episodesContent.map((content, index) => {
        const epNumber = fromEp + index;
        const postRef = doc(collection(db, "posts"));
        return setDoc(postRef, {
          head: `${head} ${season} Ep ${epNumber}`,
          story: content,
          categories,
          folderId: folder,
          imageUrl: uploadedImageUrl,
          author: username,
          createdAt: new Date().toISOString(),
          episodeNumber: epNumber,
          season,
          monetizationStatus: "pending",
        });
      });

      await Promise.all(promises);
      setLoading(false);
      alert("✅ Inkuru zose zoherejwe neza!");
      router.push("/");
    } catch (err) {
      console.error("Firestore Error:", err);
      setLoading(false);
      setErrorMessage("Hari ikibazo: " + err.message);
    }
  };

  // 🟢 Categories
  const handleCategoryChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setCategories(selected);
    setCategoryPreview(selected);
  };

  const handleEpisodeChange = (index, value) => {
    setEpisodesContent((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  // 🟩 UI
  return (
    <div className={styles.container}>
      <Net />
      <Folder />

      <h1 className={styles.title}>NetStory Uploader</h1>
      <p className={styles.username}>
        Logged in as <strong>{username}</strong>
      </p>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {step === 1 && (
        <form onSubmit={handleStep1} className={styles.form}>
          <h2 className={styles.stepTitle}>Step 1 — Ibyerekeye&apos;inkuru</h2>

          <input
            type="text"
            placeholder="Izina ry'inkuru (Head)"
            value={head}
            onChange={(e) => setHead(e.target.value)}
            className={styles.input}
            required
          />

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={styles.input}
            required
          />

          {imageUrl && (
            <img src={imageUrl} alt="Preview" className={styles.previewImg} />
          )}

          <select
            multiple
            value={categories}
            onChange={handleCategoryChange}
            className={styles.select}
          >
            <option value="Action">Action</option>
            <option value="Drama">Drama</option>
            <option value="Comedy">Comedy</option>
            <option value="Sex Story">Sex Story</option>
            <option value="Love-Story">Love-story</option>
            <option value="Horror">Horror</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Historical">Historical</option>
            <option value="Kingdom">Kingdom</option>
            <option value="Children">Children</option>
            <option value="Educational">Educational</option>
            <option value="Crime">Crime</option>
            <option value="Political">Political</option>
          </select>

          <div className={styles.tagsPreview}>
            {categoryPreview.map((cat) => (
              <span key={cat} className={styles.tag}>
                {cat}
              </span>
            ))}
          </div>

          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">-- Hitamo Folder --</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>

          <div className={styles.flexRow}>
            <label>Season:</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className={styles.selectMini}
            >
              {Array.from({ length: 20 }, (_, i) => (
                <option key={i} value={`S${String(i + 1).padStart(2, "0")}`}>
                  S{String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.flexRow}>
            <label>From:</label>
            <input
              type="number"
              min={1}
              value={fromEp}
              onChange={(e) => setFromEp(parseInt(e.target.value))}
              className={styles.inputMini}
            />
            <label>To:</label>
            <input
              type="number"
              min={fromEp}
              value={toEp}
              onChange={(e) => setToEp(parseInt(e.target.value))}
              className={styles.inputMini}
            />
          </div>

          <button type="submit" className={styles.button}>
            Next ➡️
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className={styles.form}>
          <h2 className={styles.stepTitle}>Step 2 — Andika Episodes</h2>

          {episodesContent.map((content, index) => (
            <div key={index} className={styles.episodeContainer}>
              <h3>
                {head} {season} Ep {fromEp + index}
              </h3>
              <div
                contentEditable
                className={styles.editableDiv}
                onInput={(e) =>
                  handleEpisodeChange(index, e.currentTarget.innerHTML)
                }
                suppressContentEditableWarning
              ></div>
            </div>
          ))}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "📤 Inkuru zirimo koherezwa..." : "✅ Ohereza Inkuru Zose"}
          </button>
        </form>
      )}
    </div>
  );
}
