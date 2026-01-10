import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import cookie from "cookie";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  deleteDoc,
  limit,
} from "firebase/firestore";
import { db } from "@/components/firebase";
import styles from "@/styles/freema.module.css";
import { FaTrashAlt, FaComment } from "react-icons/fa";

export default function FreemaPage({ username, initialPosts }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts || []);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Redirect to login if no username
  useEffect(() => {
    if (!username) {
      router.push("/login");
    }
  }, [username, router]);

  // Delete post
  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      setLoadingDelete(true);
      await deleteDoc(doc(db, "free", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setLoadingDelete(false);
      alert("Post deleted successfully!");
    } catch (err) {
      console.error(err);
      setLoadingDelete(false);
      alert("Failed to delete post.");
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
                  <FaComment /> Comments ({post.comments?.length || 0})
                </h3>
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((c) => (
                    <div key={c.id} className={styles.commentItem}>
                      <small>{c.author}</small>
                      <p>{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================
// SERVER SIDE
// ==========================
export async function getServerSideProps(context) {
  try {
    const cookies = cookie.parse(context.req.headers.cookie || "");
    const username = cookies.username || null;

    if (!username) {
      return {
        redirect: { destination: "/login", permanent: false },
      };
    }

    // Fata first 10 posts z'umukoresha
    const postsRef = collection(db, "free");
    const q = query(
      postsRef,
      where("author", "==", username),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const snap = await getDocs(q);

    const initialPosts = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      head: docSnap.data().head || "",
      story: docSnap.data().story || "",
      imageUrl: docSnap.data().imageUrl || null,
      comments: docSnap.data().comments || [],
    }));

    return { props: { username, initialPosts } };
  } catch (err) {
    console.error("SSR error:", err);
    return { props: { username: null, initialPosts: [] } };
  }
}
