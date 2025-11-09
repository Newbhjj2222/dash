// pages/index.js
import React, { useState, useEffect } from "react";
import { db } from "@/components/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  doc,
  deleteDoc,
} from "firebase/firestore";
import Head from "next/head";
import * as cookie from "cookie";
import styles from "@/styles/index.module.css";
import { useRouter } from "next/router";
import Net from "../components/Net";
import { FaEye, FaComments, FaEdit, FaTrash } from "react-icons/fa";

const stripHTML = (html) => (html ? html.replace(/<[^>]*>/g, "") : "");

export default function Home({ initialPosts, totalPosts, totalViews, totalComments }) {
  const [posts, setPosts] = useState(initialPosts);
  const [search, setSearch] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  // 🔍 Search
  const filteredPosts = posts.filter((p) =>
    p.head.toLowerCase().includes(search.toLowerCase())
  );

  // 🗑 Delete post without full refresh
  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to permanently delete this post?")) {
      await deleteDoc(doc(db, "posts", id));
      setPosts((prev) => prev.filter((p) => p.id !== id));
      alert("Post deleted successfully.");
    }
  };

  const handleEdit = (id) => {
    router.push(`/Editor?id=${id}`);
  };

  // 💬 Toggle comments (load only when opened)
  const toggleComments = async (id) => {
    setOpenComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    // Only fetch if not loaded yet
    if (!openComments[id]) {
      const commentsRef = collection(db, "posts", id, "comments");
      const commentsSnapshot = await getDocs(commentsRef);
      const comments = commentsSnapshot.docs.map((c) => ({
        id: c.id,
        author: c.data().author || "Unknown",
        text: c.data().text || "",
      }));

      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, comments } : p))
      );
    }
  };

  // 📜 Load more posts (10 by 10)
  const loadMorePosts = async () => {
    setLoadingMore(true);

    try {
      const username = document.cookie
        .split("; ")
        .find((row) => row.startsWith("username="))
        ?.split("=")[1];

      if (!username) return;

      const postsRef = collection(db, "posts");
      const q = query(
        postsRef,
        where("author", "==", username),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(10)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const newPosts = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          head: data.head || "",
          story: data.story || "",
          category: data.categories || "",
          image: data.imageUrl || null,
          views: data.views || 0,
          comments: [],
        };
      });

      setPosts((prev) => [...prev, ...newPosts]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error("Error loading more posts:", error);
    }

    setLoadingMore(false);
  };

  return (
    <>
      <Head>
        <title>Author Dashboard</title>
      </Head>

      <div className={styles.container}>
        <Net />

        {/* Dashboard Cards */}
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>Total Posts</h3>
            <p>{totalPosts}</p>
          </div>
          <div className={styles.card}>
            <h3>Total Views</h3>
            <p>{totalViews}</p>
          </div>
          <div className={styles.card}>
            <h3>Total Comments</h3>
            <p>{totalComments}</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        {/* Posts */}
        <div className={styles.postsList}>
          {filteredPosts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              {post.image && (
                <img
                  src={post.image}
                  alt={post.head}
                  className={styles.postImage}
                  loading="lazy"
                />
              )}
              <h2 className={styles.postHead}>{post.head}</h2>
              <p className={styles.postSummary}>
                {stripHTML(post.story).slice(0, 400)}
                {post.story.length > 400 ? "..." : ""}
              </p>

              <p className={styles.postCategory}>
                <strong>Category:</strong> {post.category}
              </p>

              <p className={styles.postStats}>
                <FaEye /> {post.views} &nbsp;&nbsp;
                <FaComments /> {post.comments?.length || 0}
              </p>

              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => handleEdit(post.id)}>
                  <FaEdit /> Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(post.id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>

              {/* Toggle Comments */}
              <button
                className={styles.toggleBtn}
                onClick={() => toggleComments(post.id)}
              >
                {openComments[post.id] ? "Hide Comments" : "Show Comments"}
              </button>

              {/* Comments */}
              {openComments[post.id] && (
                <div className={styles.commentsList}>
                  {post.comments?.length > 0 ? (
                    post.comments.map((comment) => (
                      <div key={comment.id} className={styles.commentCard}>
                        <strong>{comment.author}:</strong> {comment.text}
                      </div>
                    ))
                  ) : (
                    <p className={styles.noComments}>No comments yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <button
            className={styles.loadMoreBtn}
            onClick={loadMorePosts}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Reba izindi"}
          </button>
        )}
      </div>
    </>
  );
}

// 🔥 SERVER SIDE: Ifata posts 10 gusa ku ikubitiro
export async function getServerSideProps(context) {
  const cookieHeader = context.req?.headers?.cookie || "";
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const username = cookies.username || null;

  if (!username) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const postsRef = collection(db, "posts");
  const q = query(
    postsRef,
    where("author", "==", username),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  const querySnapshot = await getDocs(q);

  const posts = querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      head: data.head || "",
      story: data.story || "",
      category: data.categories || "",
      image: data.imageUrl || null,
      views: data.views || 0,
      comments: [],
    };
  });

  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalComments = 0; // Comments zizaza nyuma

  return {
    props: {
      initialPosts: posts,
      totalPosts: posts.length,
      totalViews,
      totalComments,
    },
  };
}
