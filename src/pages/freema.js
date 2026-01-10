'use client';
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/components/firebase";
import styles from "@/styles/freema.module.css";
import { FaTrashAlt, FaComment } from "react-icons/fa";

/* ======================
   HELPERS
====================== */
const stripHTML = (html = "") => html.replace(/<[^>]*>/g, "");

/* ======================
   PAGE
====================== */
export default function FreemaPage({ initialPosts, username }) {
  const router = useRouter();

  const [posts, setPosts] = useState(initialPosts || []);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // 📌 Client-side: lastDoc snapshot for pagination
  useEffect(() => {
    if (posts.length > 0) {
      setLastDoc(posts[posts.length - 1].createdAt || null);
    }
  }, [posts]);

  // Redirect to login if username is missing
  useEffect(() => {
    if (!username) {
      router.push("/login");
    }
  }, [username, router]);

  // 🟢 Delete post
  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post permanently?")) return;

    try {
      setLoadingDelete(true);

      // Delete post
      await deleteDoc(doc(db, "free", postId));

      // Update UI
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setLoadingDelete(false);
      alert("Post deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete post.");
      setLoadingDelete(false);
    }
  };

  // 🟢 Load more posts (client-side only)
  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);

    try {
      const ref = collection(db, "free");
      let q = query(
        ref,
        where("author", "==", username),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      if (lastDoc) {
        q = query(
          ref,
          where("author", "==", username),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(10)
        );
      }

      const snap = await getDocs(q);

      const newPosts = snap.docs.map((d) => ({
        id: d.id,
        head: d.data().head || "",
        story: d.data().story || "",
        imageUrl: d.data().imageUrl || null,
        categories: d.data().categories || [],
        createdAt: d.data().createdAt || null,
        comments: d.data().comments || [],
      }));

      setPosts((prev) => [...prev, ...newPosts]);
      setLastDoc(snap.docs[snap.docs.length - 1]?.data().createdAt || null);
      setHasMore(snap.docs.length === 10);
    } catch (err) {
      console.error("Pagination error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>{username}'s Posts</title>
        <meta name="description" content={`All posts by ${username}`} />
      </Head>

      <h1 className={styles.pageTitle}>{username}'s Posts</h1>

      {posts.length === 0 && <p>No posts yet.</p>}

      <div className={styles.postsGrid}>
        {posts.map((post) => (
          <div key={post.id} className={styles.postCard}>
            {post.imageUrl && (
              <img src={post.imageUrl} alt={post.head} className={styles.postImage} />
            )}

            <div className={styles.postContent}>
              <h2 className={styles.postTitle}>{post.head}</h2>

              <div
                className={styles.storyWrapper}
                dangerouslySetInnerHTML={{ __html: post.story }}
              />

              <div className={styles.actions}>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(post.id)}
                  disabled={loadingDelete}
                >
                  <FaTrashAlt /> Delete
                </button>
              </div>

              <div className={styles.commentsSection}>
                <h3>
                  <FaComment /> Comments ({post.comments.length})
                </h3>
                {post.comments.length === 0 && <p>No comments yet.</p>}
                {post.comments.map((c) => (
                  <div key={c.id} className={styles.commentItem}>
                    <small>{c.author}</small>
                    <p>{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          className={styles.loadMoreBtn}
          onClick={loadMorePosts}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}

/* ======================
   SERVER SIDE
====================== */
import cookie from "cookie";

export async function getServerSideProps(context) {
  const cookies = cookie.parse(context.req.headers.cookie || "");
  const username = cookies.username || null;

  if (!username) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  try {
    const ref = collection(db, "free");
    const q = query(
      ref,
      where("author", "==", username),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const snap = await getDocs(q);

    const initialPosts = snap.docs.map((d) => ({
      id: d.id,
      head: d.data().head || "",
      story: d.data().story || "",
      imageUrl: d.data().imageUrl || null,
      categories: d.data().categories || [],
      createdAt: d.data().createdAt || null,
      comments: d.data().comments || [],
    }));

    return {
      props: {
        username,
        initialPosts,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      props: { username, initialPosts: [] },
    };
  }
}
