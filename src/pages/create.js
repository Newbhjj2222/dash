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

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [head, setHead] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryPreview, setCategoryPreview] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState("");
  const [season, setSeason] = useState("S01");
  const [fromEp, setFromEp] = useState(1);
  const [toEp, setToEp] = useState(1);
  const [episodesContent, setEpisodesContent] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ Ibi ni byo byongera "Inkuru ziri koherezwa..."

  // 🔹 Fata username muri cookies
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

  // 🔹 Fata folders z'umukoresha
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
      }
    };
    fetchFolders();
  }, [username, db]);

  // 🔹 Hindura ifoto muri base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result);
    reader.readAsDataURL(file);
  };

  // 🔹 Step 1
  const handleStep1 = (e) => {
    e.preventDefault();
    if (!head || !folder || categories.length === 0) {
      alert("Wuzuza amakuru yose!");
      return;
    }
    if (fromEp > toEp) {
      alert("From ntigomba kurenza To!");
      return;
    }
    const total = toEp - fromEp + 1;
    setEpisodesContent(Array.from({ length: total }, () => ""));
    setStep(2);
  };

  // 🔹 Step 2 — Bika muri Firestore
  const handleStep2 = async (e) => {
    e.preventDefault();
    if (episodesContent.some((ep) => !ep.trim())) {
      alert("Andika content ya buri episode!");
      return;
    }

    setLoading(true); // 🔹 Tangira “loading”

    const promises = episodesContent.map((content, index) => {
      const epNumber = fromEp + index;
      const postRef = doc(collection(db, "posts"));
      return setDoc(postRef, {
        head: `${head} ${season} Ep ${epNumber}`,
        story: content,
        categories,
        folderId: folder,
        imageUrl,
        author: username,
        createdAt: new Date().toISOString(),
        episodeNumber: epNumber,
        season,
      });
    });

    try {
      await Promise.all(promises);
      alert("Inkuru zose zoherejwe neza ✅");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Hari ikibazo cyo kubika inkuru!");
    } finally {
      setLoading(false); // 🔹 Isoza “loading”
    }
  };

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

  return (
    <div className={styles.container}>
      <Net />
      <Folder />
      <h1 className={styles.title}>NetStory Uploader</h1>
      <p className={styles.username}>
        Logged in as <strong>{username}</strong>
      </p>

      {step === 1 && (
        <form onSubmit={handleStep1} className={styles.form}>
          {/* Step 1 Form */}
          {/* ... ibindi byose ubyihorere uko biri */}
          <button type="submit" className={styles.button}>Next</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className={styles.form}>
          <h2 className={styles.stepTitle}>Step 2 — Andika Episodes</h2>
          {episodesContent.map((content, index) => (
            <div key={index} className={styles.episodeContainer}>
              <h3>{head} {season} Ep {fromEp + index}</h3>
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
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Inkuru ziri koherezwa..." : "Submit All Episodes"}
          </button>
        </form>
      )}
    </div>
  );
}
