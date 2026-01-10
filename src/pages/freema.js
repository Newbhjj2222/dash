import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { db } from "../components/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import styles from "../styles/freema.module.css";
import { FaTrashAlt, FaComment } from "react-icons/fa";

// 🟢 SSR: Fata posts z'umukoresha uri muri cookies
export async function getServerSideProps(context) {
  try {
    const cookies = context.req.headers.cookie || "";
    const userCookie = cookies
      .split("; ")
      .find((row) => row.startsWith("username="));
    if (!userCookie) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const username = decodeURIComponent(userCookie.split("=")[1]);

    // Fata posts z'umukoresha
    const postsRef = collection(db, "free");
    const q = query(
      postsRef,
      where("author", "==", username),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const posts = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
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

    return {
      props: {
        username,
        posts,
      },
    };
  } catch (err) {
    console.error(err);
    return { props: { username: null, posts: [] } };
  }
}

export default function FreemaPage({ username, posts: initialPosts }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(false);

  if (!username) {
    return <p>Redirecting to login...</p>;
  }

  // 🟢 Delete post
  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post permanently?"))
      return;

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
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setLoading(false);
      alert("Post deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete post.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>{username}'s Posts</title>
        <meta
          name="description"
          content={`All posts written by ${username}`}
        />
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
              <small>
                Season: {post.season || "nono"} | Episode: {post.episodeNumber || "nono"}
              </small>

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
                <h3><FaComment /> Comments ({post.comments.length})</h3>
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
    </div>
  );
}
