'use client';
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/components/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FaBold, FaItalic, FaUnderline, FaHeading, FaListUl, FaLink, FaImage, FaSave, FaTrash, FaArrowLeft } from "react-icons/fa";
import styles from "@/styles/editor.module.css";
import Net from "../components/Net";

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id"); // Get ?id=POSTID
  const editorRef = useRef(null);

  const [head, setHead] = useState("");
  const [story, setStory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch post data once
  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      try {
        const ref = doc(db, "posts", postId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setHead(data.head || "");
          setStory(data.story || "");
          setImageUrl(data.imageUrl || "");
          if (editorRef.current) editorRef.current.innerHTML = data.story || "";
        } else {
          alert("Inkuru ntiboneka.");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };
    fetchPost();
  }, [postId, router]);

  // Toolbar commands
  const formatText = (command) => {
    document.execCommand(command, false, null);
  };

  const insertImage = () => {
    const url = prompt("Shyiramo URL y'ifoto:");
    if (!url) return;
    document.execCommand("insertImage", false, url);
  };

  // Save post
  const savePost = async () => {
    if (!head.trim()) return alert("Shyiramo umutwe w'inkuru!");
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;
    setLoading(true);
    try {
      const ref = doc(db, "posts", postId);
      await updateDoc(ref, {
        head,
        story: content,
        imageUrl,
        updatedAt: new Date(),
      });
      setStory(content);
      setLoading(false);
      alert("Inkuru ivuguruwe neza ✅");
    } catch (error) {
      setLoading(false);
      console.error("Error saving post:", error);
      alert("Byanze gukomeza kubika inkuru.");
    }
  };

  // Delete post
  const deletePost = async () => {
    if (!confirm("Ushaka koko gusiba iyi nkuru?")) return;
    try {
      await updateDoc(doc(db, "posts", postId), { deleted: true });
      alert("Inkuru yasibwe 🚫");
      router.push("/");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Byanze gusiba inkuru.");
    }
  };

  // Input handler: cursor-safe
  const handleInput = (e) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    setStory(editorRef.current.innerHTML); // update state
    sel.removeAllRanges();
    sel.addRange(range); // restore cursor
  };

  return (
    <div className={styles.editorContainer}>
    <Net />
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button onClick={() => router.back()} title="Subira inyuma"><FaArrowLeft /></button>
        <button onClick={() => formatText("bold")} title="Bold"><FaBold /></button>
        <button onClick={() => formatText("italic")} title="Italic"><FaItalic /></button>
        <button onClick={() => formatText("underline")} title="Underline"><FaUnderline /></button>
        <button onClick={() => formatText("insertUnorderedList")} title="List"><FaListUl /></button>
        <button onClick={() => formatText("createLink")} title="Link"><FaLink /></button>
        <button onClick={() => formatText("formatBlock", "<h2>")} title="Heading"><FaHeading /></button>
        <button onClick={insertImage} title="Insert Image"><FaImage /></button>
        <button onClick={savePost} disabled={loading} title="Save"><FaSave /> {loading ? "Irabika..." : "Bika"}</button>
        <button onClick={deletePost} className={styles.delete} title="Delete"><FaTrash /></button>
      </div>

      {/* Image display */}
      {imageUrl && <img src={imageUrl} alt={head} className={styles.postImage} />}

      {/* Head input */}
      <input
        className={styles.titleInput}
        placeholder="Andika umutwe w’inkuru (head)..."
        value={head}
        onChange={(e) => setHead(e.target.value)}
      />

      {/* Editor area */}
      <div
        className={styles.editorArea}
        contentEditable
        suppressContentEditableWarning
        ref={editorRef}
        onInput={handleInput}
      ></div>
    </div>
  );
}
