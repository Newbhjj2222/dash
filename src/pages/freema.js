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
  startAfter,
  limit,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../components/firebase";
import styles from "../styles/freema.module.css";
import { FaTrashAlt, FaComment } from "react-icons/fa";

const POSTS_LIMIT = 40;

export async function getServerSideProps(context) {
  // 🟢 Fata username muri cookies server-side
  const cookieHeader = context.req.headers.cookie || "";
  const match = cookieHeader
    .split("; ")
    .find((c) => c.startsWith("username="));

  if (!match) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const username = decodeURIComponent(match.split("=")[1]);

  // 🟢 Fata first 40 posts
  const postsRef = collection(db, "free");
  const q = query(
    postsRef,
    where("author", "==", username),
    orderBy("createdAt", "desc"),
    limit(POSTS_LIMIT)
  );

  const snap = await getDocs(q);

  const posts = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const data = docSnap.data();

      // Fata comments buri post
      const commentsRef = collection(db, "free", docSnap.id, "comments");
      const commentsSnap = await getDocs(
        query(commentsRef, orderBy("createdAt", "desc"))
      );
      const comments = commentsSnap.docs.map((c) => ({
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

  const lastDoc = snap.docs[snap.docs.length - 1] || null;

  return {
    props: {
      username,
      initialPosts: posts,
      lastDocId: lastDoc ? lastDoc.id : null,
    },
  };
}

export default function FreemaPage({ username, initialPosts, lastDocId }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === POSTS_LIMIT);
  const [lastDoc, setLastDoc] = useState(lastDocId);

  // 🟢 Client-side username (js-cookie)
  useEffect(() => {
    const cookieUser = Cookies.get("username");
    if (!cookieUser) router.push("/login");
  }, [router]);

  // 🟢 Delete post + comments
  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post permanently?")) return;

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

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setLoading(false);
      alert("Post deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete post.");
      setLoading(false);
    }
  };

  // 🟢 Load more posts
  const loadMorePosts = async () => {
    if (!hasMore || loading) return;
    setLoading(true);

    try {
      // Fata username client-side
      const username = Cookies.get("username");
      if (!username) {
        router.push("/login");
        return;
      }

      const postsRef = collection(db, "free");
      let startAfterDoc = null;
      if (lastDoc) startAfterDoc = doc(db, "free", lastDoc);

      let q = query(
        postsRef,
        where("author", "==", username),
        orderBy("createdAt", "desc"),
        startAfterDoc || null,
        limit(POSTS_LIMIT)
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const newPosts = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const commentsRef = collection(db, "free", docSnap.id, "comments");
          const commentsSnap = await getDocs(
            query(commentsRef, orderBy("createdAt", "desc"))
          );
          const comments = commentsSnap.docs.map((c) => ({ id: c.id, ...c.data() }));
          return { id: docSnap.id, ...data, comments };
        })
      );

      setPosts((prev) => [...prev, ...newPosts]);
      const last = snap.docs[snap.docs.length - 1];
      setLastDoc(last ? last.id : null);
      setHasMore(snap.docs.length === POSTS_LIMIT);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>{username}'s Posts</title>
      </Head>

      <h1 className={styles.pageTitle}>{username}'s Posts</h1>

      {loading && <p>Processing...</p>}
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
        <button className={styles.loadMoreBtn} onClick={loadMorePosts} disabled={loading}>
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
