import React, { useState, useEffect } from "react";
import { db } from "@/components/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import Head from "next/head";
import * as cookie from "cookie";
import styles from "@/styles/index.module.css";
import { useRouter } from "next/router";

const stripHTML = (html) => (html ? html.replace(/<[^>]*>/g, "") : "");

export default function Home({ initialPosts, totalPosts, totalViews, totalComments }) {
  const [search, setSearch] = useState("");
  const [filteredPosts, setFilteredPosts] = useState(initialPosts);
  const [openComments, setOpenComments] = useState({});
  const router = useRouter();

  const toggleComments = (id) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to permanently delete this post?")) {
      await deleteDoc(doc(db, "posts", id));
      alert("Post deleted successfully.");
      router.replace(router.asPath); // refresh
    }
  };

  const handleEdit = (id) => {
    router.push(`/Editor?id=${id}`);
  };

  useEffect(() => {
    const filtered = initialPosts.filter((post) =>
      post.head.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [search, initialPosts]);

  return (
    <>
      <Head>
        <title>Posts Dashboard</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </Head>

      <div className={styles.container}>
        {/* Dashboard cards */}
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
                <img src={post.image} alt={post.head} className={styles.postImage} />
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
                <i className="fas fa-eye"></i> {post.views} &nbsp;&nbsp;
                <i className="fas fa-comments"></i> {post.comments.length}
              </p>

              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => handleEdit(post.id)}>
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(post.id)}>
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>

              {/* Toggle Comments Button */}
              <button
                className={styles.toggleBtn}
                onClick={() => toggleComments(post.id)}
              >
                {openComments[post.id] ? "Hide Comments" : "Show Comments"}
              </button>

              {/* Comments */}
              {openComments[post.id] && (
                <div className={styles.commentsList}>
                  {post.comments.length > 0 ? (
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
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const cookieHeader = context.req?.headers?.cookie || "";
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const username = cookies.username || null;

  if (!username) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("author", "==", username), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  const posts = await Promise.all(
    querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const commentsRef = collection(db, "posts", docSnap.id, "comments");
      const commentsSnapshot = await getDocs(commentsRef);

      const comments = commentsSnapshot.docs.map((c) => ({
        id: c.id,
        author: c.data().author || "Unknown",
        text: c.data().text || "",
      }));

      return {
        id: docSnap.id,
        head: data.head || "",
        story: data.story || "",
        category: data.categories || "",
        image: data.imageUrl || null,
        views: data.views || 0,
        comments,
      };
    })
  );

  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0);

  return {
    props: {
      initialPosts: posts,
      totalPosts: posts.length,
      totalViews,
      totalComments,
    },
  };
}
