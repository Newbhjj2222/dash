import React from "react";
import cookie from "cookie";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { app } from "@/components/firebase";
import styles from "@/styles/freema.module.css";

const db = getFirestore(app);

export async function getServerSideProps(context) {
  const cookies = cookie.parse(context.req.headers.cookie || "");
  const username = cookies.username || null;

  if (!username) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const posts = [];

  const q = query(
    collection(db, "free"),
    where("author", "==", username),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  for (const postDoc of snap.docs) {
    const postData = postDoc.data();

    // 🔹 Fata comments
    const commentsSnap = await getDocs(
      collection(db, "free", postDoc.id, "comments")
    );

    const comments = commentsSnap.docs.map((c) => ({
      id: c.id,
      ...c.data(),
    }));

    posts.push({
      id: postDoc.id,
      ...postData,
      comments,
    });
  }

  return {
    props: {
      username,
      posts: JSON.parse(JSON.stringify(posts)),
    },
  };
}

export default function FreemaPage({ username, posts }) {
  const handleDelete = async (postId) => {
    if (!confirm("Uzi neza ko ushaka gusiba iyi post burundu?")) return;

    try {
      // 🧨 Siba comments zose
      const commentsSnap = await getDocs(
        collection(db, "free", postId, "comments")
      );

      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, "free", postId, "comments", c.id));
      }

      // 🧨 Siba post
      await deleteDoc(doc(db, "free", postId));

      location.reload();
    } catch (err) {
      alert("Hari ikibazo mu gusiba post");
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Freema Posts</h1>
      <p className={styles.user}>
        Logged in as <strong>{username}</strong>
      </p>

      {posts.length === 0 && (
        <p className={styles.empty}>Nta post urashyiramo</p>
      )}

      {posts.map((post) => (
        <div key={post.id} className={styles.postCard}>
          <h2>{post.head}</h2>

          {post.imageUrl && (
            <img src={post.imageUrl} className={styles.image} />
          )}

          <div
            className={styles.story}
            dangerouslySetInnerHTML={{ __html: post.story }}
          />

          <p className={styles.meta}>
            🕒 {new Date(post.createdAt).toLocaleString()}
          </p>

          <button
            className={styles.deleteBtn}
            onClick={() => handleDelete(post.id)}
          >
            🗑️ Delete Post
          </button>

          {/* COMMENTS */}
          <div className={styles.comments}>
            <h4>Comments ({post.comments.length})</h4>

            {post.comments.length === 0 && (
              <p className={styles.noComment}>Nta comments zirabaho</p>
            )}

            {post.comments.map((c) => (
              <div key={c.id} className={styles.comment}>
                <strong>{c.username}</strong>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
