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
        console.error("Firebase Error fetching folders:", err);
        setErrorMessage("❌ Firebase Error fetching folders: " + (err.message || err));
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
      setErrorMessage("❌ Wuzuza amakuru yose!");
      return;
    }
    if (fromEp > toEp) {
      setErrorMessage("❌ From ntigomba kurenza To!");
      return;
    }

    const total = toEp - fromEp + 1;
    setEpisodesContent(Array.from({ length: total }, () => ""));
    setStep(2);
  };

  // 🟢 Function yo kohereza image kuri Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Newtalents");
    formData.append("cloud_name", "dilowy3fd");

    const endpoint = "https://api.cloudinary.com/v1_1/dilowy3fd/image/upload";

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      throw new Error(`Cloudinary JSON parse error: ${jsonErr.message || jsonErr}`);
    }

    if (!res.ok || !data.secure_url) {
      throw new Error(`Cloudinary upload failed: ${JSON.stringify(data)}`);
    }

    return data.secure_url;
  };

  // 🟢 Step 2 handler — Upload Image + Bika muri Firestore
  const handleStep2 = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!navigator.onLine) {
      setErrorMessage("❌ Nta internet ihari. Reba connection yawe.");
      return;
    }

    // Reba niba ari episodic cyangwa ari inkuru imwe
    const isEpisodic = episodesContent.length > 1;

    if (isEpisodic && episodesContent.some((ep) => !ep.trim())) {
      setErrorMessage("❌ Andika content ya buri episode!");
      return;
    }

    if (!imageFile) {
      setErrorMessage("❌ Ntufite ifoto wahisemo!");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Upload image to Cloudinary
      const uploadedImageUrl = await uploadToCloudinary(imageFile);

      // 2️⃣ Bika muri Firestore (collection 'free' gusa)
      const postsCollection = collection(db, "free");

      if (isEpisodic) {
        // Inkuru nyinshi (episodic)
        const promises = episodesContent.map((content, index) => {
          const epNumber = fromEp + index;
          const postRef = doc(postsCollection);
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
      } else {
        // Inkuru imwe (non-episodic)
        const postRef = doc(postsCollection);
        await setDoc(postRef, {
          head,
          story: episodesContent[0],
          categories,
          folderId: folder,
          imageUrl: uploadedImageUrl,
          author: username,
          createdAt: new Date().toISOString(),
          episodeNumber: "nono",
          season: "nono",
          monetizationStatus: "pending",
        });
      }

      setLoading(false);
      alert("✅ Inkuru zose zoherejwe neza!");
      router.push("/");
    } catch (err) {
      console.error("Cloudinary/Firestore Error:", err);
      setLoading(false);
      setErrorMessage("❌ Hari ikibazo: " + (err.message || JSON.stringify(err)));
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
            {[
              "Action", "Drama", "Comedy", "Sex 🔞Story", "Love-Story", "Horror",
              "Sci-Fi", "Fantasy", "Historical", "Kingdom", "Children",
              "Educational", "Crime", "Political"
            ].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
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
              value={episodesContent.length > 1 ? season : "nono"}
              onChange={(e) => setSeason(e.target.value)}
              className={styles.selectMini}
              disabled={episodesContent.length === 1}
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
              disabled={toEp === 1 && fromEp === 1}
            />
            <label>To:</label>
            <input
              type="number"
              min={fromEp}
              value={toEp}
              onChange={(e) => setToEp(parseInt(e.target.value))}
              className={styles.inputMini}
              disabled={toEp === 1 && fromEp === 1}
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
                {head} {episodesContent.length > 1 ? `${season} Ep ${fromEp + index}` : "nono"}
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
