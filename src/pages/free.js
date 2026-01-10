'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
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

  // 🟢 Fata username muri cookies
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const userCookie = cookies.find((row) => row.startsWith("username="));
    if (userCookie) setUsername(decodeURIComponent(userCookie.split("=")[1]));
    else router.push("/login");
  }, [router]);

  // 🟢 Fata folders z'umukoresha
  useEffect(() => {
    if (!username) return;
    const fetchFolders = async () => {
      try {
        const qSnap = await getDocs(collection(db, "folders"));
        const userFolders = [];
        qSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.author === username) userFolders.push({ id: docSnap.id, title: data.title });
        });
        setFolders(userFolders);
      } catch (err) {
        console.error("Firebase Error fetching folders:", err);
        setErrorMessage("❌ Firebase Error fetching folders: " + (err.message || err));
      }
    };
    fetchFolders();
  }, [username, db]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

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

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Newtalents");
    formData.append("cloud_name", "dilowy3fd");

    const endpoint = "https://api.cloudinary.com/v1_1/dilowy3fd/image/upload";

    const res = await fetch(endpoint, { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok || !data.secure_url) throw new Error("Cloudinary upload failed");
    return data.secure_url;
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!navigator.onLine) {
      setErrorMessage("❌ Nta internet ihari. Reba connection yawe.");
      return;
    }
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
      const uploadedImageUrl = await uploadToCloudinary(imageFile);
      const postsCollection = collection(db, "free");

      if (isEpisodic) {
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
            createdAt: serverTimestamp(), // 🔥 Firestore Timestamp
            episodeNumber: epNumber,
            season,
            monetizationStatus: "pending",
          });
        });
        await Promise.all(promises);
      } else {
        const postRef = doc(postsCollection);
        await setDoc(postRef, {
          head,
          story: episodesContent[0],
          categories,
          folderId: folder,
          imageUrl: uploadedImageUrl,
          author: username,
          createdAt: serverTimestamp(), // 🔥 Firestore Timestamp
          episodeNumber: "nono",
          season: "nono",
          monetizationStatus: "pending",
        });
      }

      setLoading(false);
      alert("✅ Inkuru zose zoherejwe neza!");
      router.push("/freema");
    } catch (err) {
      console.error("Cloudinary/Firestore Error:", err);
      setLoading(false);
      setErrorMessage("❌ Hari ikibazo: " + (err.message || JSON.stringify(err)));
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
      <p className={styles.username}>Logged in as <strong>{username}</strong></p>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {step === 1 && (
        <form onSubmit={handleStep1} className={styles.form}>
          <h2>Step 1 — Ibyerekeye'inkuru</h2>
          <input type="text" placeholder="Izina ry'inkuru" value={head} onChange={(e)=>setHead(e.target.value)} required/>
          <input type="file" accept="image/*" onChange={handleImageChange} required/>
          {imageUrl && <img src={imageUrl} className={styles.previewImg} />}
          <select multiple value={categories} onChange={handleCategoryChange}>
            {["Action","Drama","Comedy","Sex 🔞Story","Love-Story","Horror","Sci-Fi","Fantasy","Historical","Kingdom","Children","Educational","Crime","Political"].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <div className={styles.tagsPreview}>{categoryPreview.map(c=><span key={c}>{c}</span>)}</div>
          <select value={folder} onChange={(e)=>setFolder(e.target.value)} required>
            <option value="">-- Hitamo Folder --</option>
            {folders.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <div>
            <label>Season:</label>
            <select value={episodesContent.length>1?season:"nono"} onChange={e=>setSeason(e.target.value)} disabled={episodesContent.length===1}>
              {Array.from({length:20},(_,i)=>`S${String(i+1).padStart(2,"0")}`).map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>From:</label>
            <input type="number" min={1} value={fromEp} onChange={e=>setFromEp(parseInt(e.target.value))}/>
            <label>To:</label>
            <input type="number" min={fromEp} value={toEp} onChange={e=>setToEp(parseInt(e.target.value))}/>
          </div>
          <button type="submit">Next ➡️</button>
        </form>
      )}

      {step===2 && (
        <form onSubmit={handleStep2}>
          <h2>Step 2 — Andika Episodes</h2>
          {episodesContent.map((content,index)=>(
            <div key={index}>
              <h3>{head} {episodesContent.length>1?`${season} Ep ${fromEp+index}`:"nono"}</h3>
              <div contentEditable className={styles.editableDiv} onInput={(e)=>handleEpisodeChange(index,e.currentTarget.innerHTML)} suppressContentEditableWarning></div>
            </div>
          ))}
          <button type="submit" disabled={loading}>{loading?"📤 Kohereza...":"✅ Ohereza Inkuru Zose"}</button>
        </form>
      )}
    </div>
  );
}
