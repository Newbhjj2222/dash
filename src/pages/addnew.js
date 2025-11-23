// pages/addnew.js "use client";

import { useState, useRef } from "react"; import Cookies from "js-cookie"; import Net from "@/components/Net"; import styles from "@/styles/addnew.module.css"; import { db } from "@/components/firebase"; import { collection, addDoc, serverTimestamp } from "firebase/firestore"; import { FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter, FiAlignRight, FiLink, FiImage, FiUpload, } from "react-icons/fi";

export default function AddNew({ username }) { const [title, setTitle] = useState(""); const [imageFile, setImageFile] = useState(null); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");

const contentRef = useRef(null); const API_KEY = "d3b627c6d75013b8aaf2aac6de73dcb5";

const applyFormat = (command) => { document.execCommand(command, false, null); };

const addLink = () => { const url = prompt("Andika URL"); if (url) document.execCommand("createLink", false, url); };

const handleSubmit = async (e) => { e.preventDefault();

const content = contentRef.current.innerHTML;

if (!title || !content || !imageFile) {
  setMessage("Please fill all fields");
  return;
}

setLoading(true);
setMessage("");

try {
  const formData = new FormData();
  formData.append("image", imageFile);

  const uploadResponse = await fetch(
    `https://api.imgbb.com/1/upload?key=${API_KEY}`,
    { method: "POST", body: formData }
  );

  const result = await uploadResponse.json();
  const imageUrl = result.data.url;

  await addDoc(collection(db, "news"), {
    title,
    content,
    imageUrl,
    author: Cookies.get("username") || "Unknown",
    createdAt: serverTimestamp(),
  });

  setMessage("News added successfully!");
  setTitle("");
  contentRef.current.innerHTML = "";
  setImageFile(null);
} catch (err) {
  console.error(err);
  setMessage("Failed to upload news.");
}

setLoading(false);

};

return ( <div className={styles.container}> <Net /> <h1 className={styles.title}>Add News</h1>

<form className={styles.form} onSubmit={handleSubmit}>
    <div className={styles.inputGroup}>
      <label>News Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter title"
      />
    </div>

    <label>Write Content</label>
    <div className={styles.toolbar}>
      <FiBold onClick={() => applyFormat("bold")} />
      <FiItalic onClick={() => applyFormat("italic")} />
      <FiUnderline onClick={() => applyFormat("underline")} />
      <FiAlignLeft onClick={() => applyFormat("justifyLeft")} />
      <FiAlignCenter onClick={() => applyFormat("justifyCenter")} />
      <FiAlignRight onClick={() => applyFormat("justifyRight")} />
      <FiLink onClick={addLink} />
    </div>

    <div
      ref={contentRef}
      className={styles.editor}
      contentEditable={true}
      suppressContentEditableWarning={true}
      placeholder="Andika inkuru hano..."
    ></div>

    <div className={styles.inputGroup}>
      <label>Upload Image</label>
      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
    </div>

    <button type="submit" className={styles.btn} disabled={loading}>
      {loading ? "Uploading..." : "Add News"}
    </button>

    {message && <p className={styles.message}>{message}</p>}
  </form>
</div>

); 
}

