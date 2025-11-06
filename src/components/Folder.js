import React, { useState } from "react";
import { db } from "./firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import styles from "./Folder.module.css";

const Folder = () => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Fata username muri cookies
  const getUsernameFromCookies = () => {
    const match = document.cookie.match(/(^| )username=([^;]+)/);
    return match ? match[2] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = getUsernameFromCookies();

    if (!username) {
      alert("Nta username yabonetse muri cookies.");
      return;
    }

    try {
      setLoading(true);
      const newFolderRef = doc(collection(db, "folders"));
      await setDoc(newFolderRef, {
        title,
        content,
        author: username,
        createdAt: new Date().toISOString(),
      });

      alert("Folder saved successfully!");
      setTitle("");
      setContent("");
      setShowForm(false);
      window.location.reload();
    } catch (error) {
      console.error("Error saving folder: ", error);
      alert("Error saving folder: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={styles.floatingBtn}
        onClick={() => setShowForm(!showForm)}
      >
        +
      </button>

      {/* Floating Form */}
      {showForm && (
        <div className={styles.overlay}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <h3 className={styles.title}>Create Folder</h3>

            <input
              type="text"
              placeholder="Folder Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={styles.input}
            />

            <textarea
              placeholder="Folder Description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.textarea}
            ></textarea>

            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Folder;
