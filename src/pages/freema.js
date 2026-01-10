'use client';
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/components/firebase";
import styles from "@/styles/freema.module.css";
import { FaTrashAlt, FaComment } from "react-icons/fa";

export default function FreemaPage() {
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Fata username muri cookies
  useEffect(() => {
    const user = Cookies.get("username");
    if (!user) {
      router.push("/login");
    } else {
      setUsername(user);
    }
  }, [router]);

  // 🟢 Fata posts z'umukoresha
  useEffect(() => {
    if (!username) return;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const postsRef = collection(db, "free");
        const q = query(
          postsRef,
          where("author", "==", username),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);

        const postsData = await Promise.all(
          snap.docs.map(async (docSnap) => {
            const data = docSnap.data();
            // Fata comments
            const commentsRef = collection(db, "free", docSnap.id, "comments");
            const commentsSnap = await getDocs(
              query(commentsRef, orderBy("createdAt", "desc"))
            );
            const comments = commentsSnap.docs.map(c => ({
              id: c.id,
              ...c.data(),
            }));

            return {
              id: docSnap.id,
              ...data,
              comments,
            };
          })
        );

        setPosts(postsData);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [username]);

  // 🟢 Delete post n'ibitekerezo
  const handleDelete = async (postId) => {
    if (!confirm("Urashaka koko gusiba iyi post n'ibitekerezo byose?")) return;

    try {
      setLoading(true);

      // Delete comments
      const commentsRef = collection(db, "free", postId, "comments");
      const commentsSnap = await getDocs(commentsRef);
      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, "free", postId, "comments", c.id));
      }

      // Delete post
      await deleteDoc(doc(db, "free", postId));

      // Update UI
      setPosts(prev => prev.filter(p => p.id !== postId));
      alert("Post yasibwe neza!");
    } catch (err) {
      console.error(err);
      alert("Gusiba byanze!");
    } finally {
      setLoading(false);
    }
  };

  if (!username) return <p>Redirecting to login...</p>;
  if (loading) return <p>Loading posts...</p>;

  return (
    <div className={styles.container}>
      <Head>
        <title>{username}'s Posts</title>
        <meta name="description" content={`All posts by ${username}`} />
      </Head>

      <h1 className={styles.pageTitle}>{username}'s Posts</h1>

      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <div className={styles.postsGrid}>
          {posts.map(post => (
            <div key={post.id} className={styles.postCard}>
              {post.imageUrl && (
                <img src={post.imageUrl} alt={post.head} className={styles.postImage} />
              )}

              <h2 className={styles.postTitle}>{post.head}</h2>
              <div
                className={styles.storyWrapper}
                dangerouslySetInnerHTML={{ __html: post.story }}
              />

              <div className={styles.actions}>
                <button onClick={() => handleDelete(post.id)} className={styles.deleteBtn}>
                  <FaTrashAlt /> Delete
                </button>
              </div>

              <div className={styles.commentsSection}>
                <h3><FaComment /> Comments ({post.comments.length})</h3>
                {post.comments.length === 0 && <p>No comments yet.</p>}
                {post.comments.map(c => (
                  <div key={c.id} className={styles.commentItem}>
                    <small>{c.author}</small>
                    <p>{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
