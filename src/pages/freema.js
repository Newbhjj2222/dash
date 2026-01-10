'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../components/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import styles from "../styles/freema.module.css";
import { FaTrashAlt, FaComment } from "react-icons/fa";

export default function FreemaPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Fata username muri cookies
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

  // 🟢 Fetch posts zose z'umukoresha
  useEffect(() => {
    if (!username) return;

    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, "free");
        const q = query(postsRef, where("author", "==", username), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const allPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPosts(allPosts);
          setLoading(false);
        });
        return unsubscribe;
      } catch (err) {
        console.error("Error fetching posts:", err);
        setLoading(false);
      }
    };

    fetchPosts();
  }, [username]);

  // 🟢 Delete post
  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post permanently?")) return;

    try {
      // Delete comments subcollection first
      const commentsRef = collection(db, "free", postId, "comments");
      const commentsSnap = await getDocs(commentsRef);
      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, "free", postId, "comments", c.id));
      }

      // Delete post
      await deleteDoc(doc(db, "free", postId));
      alert("Post deleted successfully!");
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>My Posts</h1>
      {loading && <p>Loading posts...</p>}

      {!loading && posts.length === 0 && <p>No posts yet.</p>}

      <div className={styles.postsGrid}>
        {posts.map((post) => (
          <div key={post.id} className={styles.postCard}>
            {post.imageUrl && <img src={post.imageUrl} alt={post.head} className={styles.postImage} />}

            <div className={styles.postContent}>
              <h2 className={styles.postTitle}>{post.head}</h2>
              <small>Season: {post.season || "nono"} | Episode: {post.episodeNumber || "nono"}</small>

              <div className={styles.storyWrapper} dangerouslySetInnerHTML={{ __html: post.story }} />

              <div className={styles.actions}>
                <button className={styles.deleteBtn} onClick={() => handleDelete(post.id)}>
                  <FaTrashAlt /> Delete
                </button>
              </div>

              <div className={styles.commentsSection}>
                <h3><FaComment /> Comments</h3>
                <CommentsList postId={post.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 🔹 Component yerekana comments kuri post
function CommentsList({ postId }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const commentsRef = collection(db, "free", postId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(allComments);
    });

    return () => unsubscribe();
  }, [postId]);

  if (comments.length === 0) return <p>No comments yet.</p>;

  return (
    <div className={styles.commentsList}>
      {comments.map((c) => (
        <div key={c.id} className={styles.commentItem}>
          <small>{c.author}</small>
          <p>{c.content}</p>
        </div>
      ))}
    </div>
  );
}
