import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/freema.module.css";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { app } from "@/components/firebase";

export async function getServerSideProps() {
  // SSR ikora rendering gusa
  return {
    props: {},
  };
}

export default function Freema() {
  const router = useRouter();
  const db = getFirestore(app);

  const [username, setUsername] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ CLIENT: Fata username muri cookies (uko wasabye)
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const userCookie = cookies.find((row) =>
      row.startsWith("username=")
    );

    if (userCookie) {
      const value = userCookie.split("=")[1];
      setUsername(decodeURIComponent(value));
    } else {
      router.push("/login");
    }
  }, [router]);

  // ✅ CLIENT: Fata posts + comments
  useEffect(() => {
    if (!username) return;

    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, "free"),
          where("author", "==", username),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);
        const data = [];

        for (const postDoc of snap.docs) {
          const commentsSnap = await getDocs(
            collection(db, "free", postDoc.id, "comments")
          );

          data.push({
            id: postDoc.id,
            ...postDoc.data(),
            comments: commentsSnap.docs.map((c) => ({
              id: c.id,
              ...c.data(),
            })),
          });
        }

        setPosts(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [username, db]);

  // 🗑️ Delete post + comments
  const deletePost = async (postId) => {
    if (!confirm("Uremeza gusiba iyi post burundu?")) return;

    try {
      const commentsSnap = await getDocs(
        collection(db, "free", postId, "comments")
      );

      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, "free", postId, "comments", c.id));
      }

      await deleteDoc(doc(db, "free", postId));

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Gusiba byanze");
    }
  };

  if (loading) {
    return <p className={styles.loading}>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <h1>Freema Posts</h1>
      <p>
        Logged in as <strong>{username}</strong>
      </p>

      {posts.length === 0 && <p>Nta post urashyiramo</p>}

      {posts.map((post) => (
        <div key={post.id} className={styles.post}>
          <h2>{post.head}</h2>

          {post.imageUrl && (
            <img src={post.imageUrl} className={styles.image} />
          )}

          <div
            dangerouslySetInnerHTML={{ __html: post.story }}
            className={styles.story}
          />

          <button
            onClick={() => deletePost(post.id)}
            className={styles.delete}
          >
            🗑️ Delete
          </button>

          <div className={styles.comments}>
            <h4>Comments ({post.comments.length})</h4>
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
