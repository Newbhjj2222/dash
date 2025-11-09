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

export default function Home({
  initialPosts,
  totalPosts: initialTotalPosts,
  totalViews: initialTotalViews,
  totalComments: initialTotalComments,  // New prop for total comments
  username,
}) {
  const router = useRouter();

  const [posts, setPosts] = useState(initialPosts);
  const [lastDoc, setLastDoc] = useState(
    initialPosts.length > 0 ? initialPosts[initialPosts.length - 1].docRef : null
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10);

  const [openComments, setOpenComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [totalComments, setTotalComments] = useState(initialTotalComments); // Initialize with SSR total

  const [totalPosts, setTotalPosts] = useState(initialTotalPosts);
  const [totalViews, setTotalViews] = useState(initialTotalViews);
  const [search, setSearch] = useState("");

  const filteredPosts = posts.filter((p) =>
    p.head.toLowerCase().includes(search.toLowerCase())
  );

  // 🔹 Lazy load comments for a post
  const toggleComments = async (id) => {
    const isOpen = openComments[id];
    if (isOpen) {
      setOpenComments((prev) => ({ ...prev, [id]: false }));
      return;
    }

    const post = posts.find((p) => p.id === id);
    if (!post) return;

    setLoadingComments((prev) => ({ ...prev, [id]: true }));

    try {
      const commentsRef = collection(db, "posts", id, "comments");
      const commentsSnap = await getDocs(commentsRef);
      const comments = commentsSnap.docs.map((c) => ({
        id: c.id,
        author: c.data().author || "Unknown",
        text: c.data().text || "",
      }));

      // Update post comments
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, comments } : p))
      );

      // Update total comments client-side
      setTotalComments((prev) => prev + comments.length);
    } catch (err) {
      console.error("Error loading comments:", err);
    }

    setOpenComments((prev) => ({ ...prev, [id]: true }));
    setLoadingComments((prev) => ({ ...prev, [id]: false }));
  };

  // 🔹 Delete post & update totals
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
      const deletedCommentsCount = deletedPost?.comments?.length || 0;

      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotalPosts((prev) => prev - 1);
      setTotalViews((prev) => prev - (deletedPost?.views || 0));
      setTotalComments((prev) => prev - deletedCommentsCount);

      alert("Post deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Error deleting post.");
    }
  };

  const handleEdit = (id) => router.push(`/Editor?id=${id}`);

  // 🔹 Load more posts (pagination)
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

      const newPosts = snapshot.docs.map((d) => ({
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

      setPosts((prev) => [...prev, ...newPosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (err) {
      console.error("Pagination error:", err);
    }

    setLoadingMore(false);
  };

  // 🔹 Compute total comments for already loaded posts (optional, on mount)
  useEffect(() => {
    async function fetchTotalComments() {
      let count = 0;
      for (const post of posts) {
        const commentsRef = collection(db, "posts", post.id, "comments");
        const snap = await getDocs(commentsRef);
        count += snap.size;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, comments: snap.docs.map(c => ({id: c.id, author: c.data().author || "Unknown", text: c.data().text || ""})) } : p
          )
        );
      }
      setTotalComments(count);
    }
    fetchTotalComments();
  }, []);

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
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        {/* POSTS LIST */}
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
                <FaComments />{" "}
                {loadingComments[post.id]
                  ? "Loading..."
                  : post.comments?.length || "-"}
              </p>

              <div className={styles.actions}>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEdit(post.id)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(post.id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>

              <button
                className={styles.toggleBtn}
                onClick={() => toggleComments(post.id)}
              >
                {openComments[post.id] ? "Hide Comments" : "Show Comments"}
              </button>

              {openComments[post.id] && (
                <div className={styles.commentsList}>
                  {loadingComments[post.id] ? (
                    <p>Loading comments...</p>
                  ) : post.comments?.length > 0 ? (
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

        {/* LOAD MORE */}
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

// SERVER-SIDE PROPS
export async function getServerSideProps(context) {
  const cookieHeader = context.req?.headers?.cookie || "";
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const username = cookies.username || null;

  if (!username) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const postsRef = collection(db, "posts");

  // Fetch all posts to compute totals (posts & views only)
  const allSnapshot = await getDocs(
    query(postsRef, where("author", "==", username), orderBy("createdAt", "desc"))
  );

  const totalPosts = allSnapshot.size;
  let totalViews = 0;
  let totalComments = 0; // Initialize total comments counter
  const initialPosts = [];

  // Fetch each post and its comments count
  for (const docSnap of allSnapshot.docs) {
    const data = docSnap.data();
    totalViews += data.views || 0;

    // Count comments for each post
    const commentsRef = collection(db, "posts", docSnap.id, "comments");
    const commentsSnap = await getDocs(commentsRef);
    totalComments += commentsSnap.size; // Add to total comments

    // Prepare initial post data
    initialPosts.push({
      id: docSnap.id,
      head: data.head || "",
      story: data.story || "",
      category: data.categories || "",
      image: data.imageUrl || null,
      views: data.views || 0,
      comments: [], // Initially empty, will be filled on client-side
      createdAt: data.createdAt,
      docRef: docSnap,
    });
  }

  return {
    props: { initialPosts, totalPosts, totalViews, totalComments, username }, // Include totalComments in props
  };
}
