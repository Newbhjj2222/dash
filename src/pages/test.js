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
  getCountFromServer,
} from "firebase/firestore";
import Head from "next/head";
import * as cookie from "cookie";
import styles from "@/styles/index.module.css";
import { useRouter } from "next/router";
import Net from "../components/Net";
import { FaEye, FaComments, FaEdit, FaTrash } from "react-icons/fa";

const stripHTML = (html) => (html ? html.replace(/<[^>]*>/g, "") : "");

export default function Home({ initialPosts, totalPosts: initialTotalPosts, totalViews: initialTotalViews, totalComments: initialTotalComments }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [lastDoc, setLastDoc] = useState(initialPosts.length > 0 ? initialPosts[initialPosts.length - 1].docRef : null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10);
  const [openComments, setOpenComments] = useState({});
  const [totalPosts, setTotalPosts] = useState(initialTotalPosts);
  const [totalViews, setTotalViews] = useState(initialTotalViews);
  const [totalComments, setTotalComments] = useState(initialTotalComments);
  const [search, setSearch] = useState("");

  const username = typeof window !== "undefined" ? document.cookie.split("; ").find((r) => r.startsWith("username="))?.split("=")[1] : null;

  const filteredPosts = posts.filter((p) =>
    p.head.toLowerCase().includes(search.toLowerCase())
  );

  // 💬 Toggle comments + lazy load
  const toggleComments = async (id) => {
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));

    const post = posts.find(p => p.id === id);
    if (!post || (post.comments && post.comments.length)) return;

    const commentsRef = collection(db, "posts", id, "comments");
    const commentsSnap = await getDocs(commentsRef);
    const comments = commentsSnap.docs.map(c => ({
      id: c.id,
      author: c.data().author || "Unknown",
      text: c.data().text || "",
    }));

    setPosts(prev => prev.map(p => p.id === id ? { ...p, comments } : p));
  };

  // 🗑 Delete post + comments & update totals
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const commentsRef = collection(db, "posts", id, "comments");
      const commentsSnap = await getDocs(commentsRef);
      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, "posts", id, "comments", c.id));
      }
      await deleteDoc(doc(db, "posts", id));

      setPosts(prev => prev.filter(p => p.id !== id));
      // Update totals
      setTotalPosts(prev => prev - 1);
      const deletedPost = posts.find(p => p.id === id);
      setTotalViews(prev => prev - (deletedPost?.views || 0));
      setTotalComments(prev => prev - (deletedPost?.comments?.length || 0));

      alert("Post deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Error deleting post.");
    }
  };

  const handleEdit = (id) => router.push(`/Editor?id=${id}`);

  // 📜 Load 10 more posts
  const loadMorePosts = async () => {
    if (!hasMore) return;
    setLoadingMore(true);

    try {
      const postsRef = collection(db, "posts");
      const q = query(
        postsRef,
        where("author", "==", username),
        orderBy("createdAt", "desc"),
        startAfter(posts[posts.length - 1].createdAt),
        limit(10)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const newPosts = snapshot.docs.map(d => ({
        id: d.id,
        head: d.data().head || "",
        story: d.data().story || "",
        category: d.data().categories || "",
        image: d.data().imageUrl || null,
        views: d.data().views || 0,
        comments: [],
        createdAt: d.data().createdAt,
        docRef: d,
      }));

      setPosts(prev => [...prev, ...newPosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (err) {
      console.error("Pagination error:", err);
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

        {/* CARDS */}
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

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.search}
        />

        {/* POSTS LIST */}
        <div className={styles.postsList}>
          {filteredPosts.map(post => (
            <div key={post.id} className={styles.postCard}>
              {post.image && <img src={post.image} alt={post.head} className={styles.postImage} loading="lazy" />}
              <h2 className={styles.postHead}>{post.head}</h2>
              <p className={styles.postSummary}>
                {stripHTML(post.story).slice(0, 400)}
                {post.story.length > 400 ? "..." : ""}
              </p>
              <p className={styles.postCategory}>
                <strong>Category:</strong> {post.category}
              </p>
              <p className={styles.postStats}>
                <FaEye /> {post.views} &nbsp;&nbsp; <FaComments /> {post.comments?.length || 0}
              </p>

              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => handleEdit(post.id)}><FaEdit /> Edit</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(post.id)}><FaTrash /> Delete</button>
              </div>

              <button className={styles.toggleBtn} onClick={() => toggleComments(post.id)}>
                {openComments[post.id] ? "Hide Comments" : "Show Comments"}
              </button>

              {openComments[post.id] && (
                <div className={styles.commentsList}>
                  {post.comments?.length > 0 ? (
                    post.comments.map(comment => (
                      <div key={comment.id} className={styles.commentCard}>
                        <strong>{comment.author}:</strong> {comment.text}
                      </div>
                    ))
                  ) : <p className={styles.noComments}>No comments yet.</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* LOAD MORE */}
        {hasMore && (
          <button className={styles.loadMoreBtn} onClick={loadMorePosts} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Reba izindi"}
          </button>
        )}
      </div>
    </>
  );
}

// SERVER SIDE
export async function getServerSideProps(context) {
  const cookieHeader = context.req?.headers?.cookie || "";
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const username = cookies.username || null;

  if (!username) return { redirect: { destination: "/login", permanent: false } };

  const postsRef = collection(db, "posts");
  const snapshotAll = await getDocs(query(postsRef, where("author", "==", username), orderBy("createdAt", "desc")));
  const totalPosts = snapshotAll.size;
  let totalViews = 0;
  let totalComments = 0;

  for (const docSnap of snapshotAll.docs) {
    const data = docSnap.data();
    totalViews += data.views || 0;
    totalComments += data.totalComments || 0;
  }

  const firstSnapshot = await getDocs(query(postsRef, where("author", "==", username), orderBy("createdAt", "desc"), limit(10)));
  const initialPosts = firstSnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    head: docSnap.data().head || "",
    story: docSnap.data().story || "",
    category: docSnap.data().categories || "",
    image: docSnap.data().imageUrl || null,
    views: docSnap.data().views || 0,
    comments: [],
    createdAt: docSnap.data().createdAt,
    docRef: docSnap,
  }));

  return {
    props: { initialPosts, totalPosts, totalViews, totalComments },
  };
}
