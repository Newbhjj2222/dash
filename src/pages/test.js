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
import Card from "@/components/Card";
import { FaEye, FaComments, FaEdit, FaTrash } from "react-icons/fa";

const stripHTML = (html) => (html ? html.replace(/<[^>]*>/g, "") : "");

export default function Home({ initialPosts, totalPosts: initialTotalPosts, totalViews: initialTotalViews, username }) {
  const router = useRouter();

  const [posts, setPosts] = useState(initialPosts);
  const [lastDoc, setLastDoc] = useState(initialPosts.length > 0 ? initialPosts[initialPosts.length - 1].docRef : null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10);

  const [loadingComments, setLoadingComments] = useState({});
  const [totalPosts, setTotalPosts] = useState(initialTotalPosts);
  const [totalViews, setTotalViews] = useState(initialTotalViews);
  const [search, setSearch] = useState("");

  const filteredPosts = posts.filter(p => p.head.toLowerCase().includes(search.toLowerCase()));

  // 🔹 Lazy load comments automatically on post render
  useEffect(() => {
    posts.forEach(post => {
      if (post.commentsLoaded) return; // skip if already loaded

      setLoadingComments(prev => ({ ...prev, [post.id]: true }));

      const fetchComments = async () => {
        try {
          const commentsRef = collection(db, "posts", post.id, "comments");
          const commentsSnap = await getDocs(commentsRef);
          const comments = commentsSnap.docs.map(c => ({
            id: c.id,
            author: c.data().author || "Unknown",
            text: c.data().text || "",
          }));

          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comments, totalComments: comments.length, commentsLoaded: true } : p));
        } catch (err) {
          console.error("Error loading comments:", err);
        } finally {
          setLoadingComments(prev => ({ ...prev, [post.id]: false }));
        }
      };

      fetchComments();
    });
  }, [posts]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const commentsRef = collection(db, "posts", id, "comments");
      const commentsSnap = await getDocs(commentsRef);
      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, "posts", id, "comments", c.id));
      }

      await deleteDoc(doc(db, "posts", id));

      const deletedPost = posts.find((p) => p.id === id);

      setPosts(prev => prev.filter(p => p.id !== id));
      setTotalPosts(prev => prev - 1);
      setTotalViews(prev => prev - (deletedPost?.views || 0));

      alert("Post deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Error deleting post.");
    }
  };

  const handleEdit = (id) => router.push(`/Editor?id=${id}`);

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

      const newPosts = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          head: data.head || "",
          story: data.story || "",
          category: data.categories || "",
          image: data.imageUrl || null,
          views: data.views || 0,
          totalComments: 0,
          comments: [],
          commentsLoaded: false,
          createdAt: data.createdAt,
          docRef: d,
        };
      });

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
      <Head><title>Author Dashboard</title></Head>
      <div className={styles.container}>
        <Net />
<Card />
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
    
    </div>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        {/* POSTS LIST */}
        <div className={styles.postsList}>
          {filteredPosts.map(post => (
            <div key={post.id} className={styles.postCard}>
              {post.image && <img src={post.image} alt={post.head} className={styles.postImage} />}
              <h2 className={styles.postHead}>{post.head}</h2>
              <p className={styles.postSummary}>
                {stripHTML(post.story).slice(0, 400)}{post.story.length > 400 ? "..." : ""}
              </p>
              <p className={styles.postCategory}><strong>Category:</strong> {post.category}</p>
              <p className={styles.postStats}>
                <FaEye /> {post.views} &nbsp;&nbsp;
                <FaComments /> {loadingComments[post.id] ? "Loading..." : post.totalComments || 0}
              </p>

              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => handleEdit(post.id)}><FaEdit /> Edit</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(post.id)}><FaTrash /> Delete</button>
              </div>

              {/* COMMENTS LIST */}
              {post.commentsLoaded && post.comments.length > 0 && (
                <div className={styles.commentsList}>
                  {post.comments.map(c => (
                    <div key={c.id} className={styles.commentCard}>
                      <strong>{c.author}:</strong> {c.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {hasMore && (
          <button className={styles.loadMoreBtn} onClick={loadMorePosts} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Reba izindi"}
          </button>
        )}
      </div>
    </>
  );
}

// SERVER-SIDE PROPS
export async function getServerSideProps(context) {
  const cookieHeader = context.req?.headers?.cookie || "";
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const username = cookies.username || null;

  if (!username) return { redirect: { destination: "/login", permanent: false } };

  const postsRef = collection(db, "posts");

  // Fetch first 10 posts only
  const firstSnapshot = await getDocs(
    query(postsRef, where("author", "==", username), orderBy("createdAt", "desc"), limit(10))
  );

  const initialPosts = firstSnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      head: data.head || "",
      story: data.story || "",
      category: data.categories || "",
      image: data.imageUrl || null,
      views: data.views || 0,
      totalComments: 0,
      comments: [],
      commentsLoaded: false,
      createdAt: data.createdAt,
      docRef: docSnap,
    };
  });

  // Compute totals
  const allSnapshot = await getDocs(query(postsRef, where("author", "==", username)));
  const totalPosts = allSnapshot.size;
  let totalViews = 0;
  allSnapshot.forEach(docSnap => { totalViews += docSnap.data().views || 0; });

  return { props: { initialPosts, totalPosts, totalViews, username } };
}
