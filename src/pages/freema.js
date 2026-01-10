import { useState } from "react";
import { db } from "@/components/firebase";
import {
  collection,
  doc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";
import styles from "@/styles/freema.module.css";
import Net from "@/components/Net";
import { FaTrashAlt, FaComment } from "react-icons/fa";

export default function FreemaPage({ initialPosts, username }) {
  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(false);

  if (!username) {
    return <p>Redirecting to login...</p>;
  }

  // Clean content: remove HTML tags
  const cleanText = (html) => {
    if (!html) return "";
    let text = html.replace(/&nbsp;/gi, " ")
                   .replace(/&amp;/gi, "&")
                   .replace(/&quot;/gi, '"')
                   .replace(/&lt;/gi, "<")
                   .replace(/&gt;/gi, ">")
                   .replace(/&#39;/gi, "'")
                   .replace(/<[^>]+>/g, " ")
                   .replace(/\s+/g, " ")
                   .trim();
    return text;
  };

  // Delete post
  const handleDelete = async (id) => {
    if (!confirm("Urashaka koko gusiba iyi post?")) return;

    setPosts(prev => prev.map(p => p.id === id ? { ...p, visible: false } : p));

    setTimeout(async () => {
      // Delete comments first
      const commentsRef = collection(db, "free", id, "comments");
      const commentsSnap = await getDocs(commentsRef);
      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, "free", id, "comments", c.id));
      }

      // Delete post
      await deleteDoc(doc(db, "free", id));
      setPosts(prev => prev.filter(p => p.id !== id));
    }, 300);
  };

  return (
    <>
      <Net />
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>My Posts</h1>

        {posts.length === 0 ? (
          <p>No posts found for user "{username}"</p>
        ) : (
          <div className={styles.postsGrid}>
            {posts.map(post => (
              <div
                key={post.id}
                className={`${styles.postCard} ${!post.visible ? styles.fadeOut : ""}`}
              >
                <p className={styles.author}>
                  <strong>Author:</strong> {post.author}
                </p>

                <h2 className={styles.title}>{post.head}</h2>

                {post.imageUrl && (
                  <img src={post.imageUrl} alt={post.head} className={styles.image} />
                )}

                <p className={styles.content}>{cleanText(post.story)}</p>

                <div className={styles.actions}>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(post.id)}>
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
    </>
  );
}

// SSR: Fetch posts authored by username and their comments
export async function getServerSideProps(context) {
  let username = "";

  if (context.req.headers.cookie) {
    const match = context.req.headers.cookie
      .split(";")
      .find(c => c.trim().startsWith("username="));
    if (match) {
      username = decodeURIComponent(match.split("=")[1]);
    }
  }

  if (!username) {
    return { props: { initialPosts: [], username: "" } };
  }

  // Fetch posts by user
  const postsRef = collection(db, "free");
  const postsQuery = query(postsRef, where("author", "==", username), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(postsQuery);

  const posts = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();

      // Fetch comments subcollection
      const commentsRef = collection(db, "free", docSnap.id, "comments");
      const commentsSnap = await getDocs(query(commentsRef, orderBy("createdAt", "desc")));
      const comments = commentsSnap.docs.map(c => ({ id: c.id, ...c.data() }));

      return {
        id: docSnap.id,
        ...data,
        comments,
        visible: true
      };
    })
  );

  return { props: { initialPosts: posts, username } };
}
