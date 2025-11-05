import React from "react";
import styles from "./Dashboard.module.css";

export default function PostsList({ posts }) {
  const handleEdit = (postId) => {
    // Fungura post muri editor page
    window.location.href = `/editor/${postId}`;
  };

  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      // Fungura Firebase Firestore
      const { db } = await import("./firebase");
      await db.collection("posts").doc(postId).delete();
      alert("Post deleted successfully. Refresh the page.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting post.");
    }
  };

  return (
    <div className={styles.postsList}>
      {posts.map((post) => (
        <div key={post.id} className={styles.postCard}>
          <h3 className={styles.postTitle}>{post.head}</h3>
          <p className={styles.postStory}>{post.story}</p>

          <div className={styles.postStats}>
            <span>👤 {post.author}</span>
            <span>👁️ {post.views}</span>
            <span>💬 {post.commentCount}</span>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.editBtn}
              onClick={() => handleEdit(post.id)}
            >
              Edit
            </button>
            <button
              className={styles.deleteBtn}
              onClick={() => handleDelete(post.id)}
            >
              Delete
            </button>
          </div>

          <div className={styles.comments}>
            {post.comments.map((c) => (
              <p key={c.id} className={styles.commentText}>
                <strong>{c.author || "Unknown"}:</strong> {c.text}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
