import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/freema.module.css";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  limit,
} from "firebase/firestore";
import { db } from "@/components/firebase";
import cookie from "cookie";

/* ======================
   SERVER SIDE PROPS
====================== */
export async function getServerSideProps(context) {
  try {
    const cookies = cookie.parse(context.req.headers.cookie || "");
    const username = cookies.username || null;

    if (!username) {
      return { redirect: { destination: "/login", permanent: false } };
    }

    const postsRef = collection(db, "free");
    const q = query(
      postsRef,
      where("author", "==", username),
      orderBy("createdAt", "desc"),
      limit(40)
    );

    const snap = await getDocs(q);

    const posts = [];
    for (const docSnap of snap.docs) {
      const commentsSnap = await getDocs(
        collection(db, "free", docSnap.id, "comments")
      );

      posts.push({
        id: docSnap.id,
        ...docSnap.data(),
        comments: commentsSnap.docs.map((c) => ({ id: c.id, ...c.data() })),
      });
    }

    return {
      props: { initialPosts: posts, username },
    };
  } catch (err) {
    console.error("SSR Error:", err);
    return {
      props: { initialPosts: [], username: null },
    };
  }
}

/* ======================
   COMPONENT
====================== */
export default function Freema({ initialPosts, username: initialUsername }) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername || "");
  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);

  /* ======================
     CLIENT: Fata username muri cookies niba SSR itabonye
  ====================== */
  useEffect(() => {
    if (username) return;

    const cookies = document.cookie.split("; ");
    const userCookie = cookies.find((row) => row.startsWith("username="));

    if (userCookie) {
      setUsername(decodeURIComponent(userCookie.split("=")[1]));
    } else {
      router.push("/login");
    }
  }, [username, router]);

  /* ======================
     DELETE POST + COMMENTS
  ====================== */
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

  if (!username) return <p className={styles.loading}>Loading...</p>;

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
            className={styles.story}
            dangerouslySetInnerHTML={{ __html: post.story }}
          />

          <button
            className={styles.delete}
            onClick={() => deletePost(post.id)}
          >
            🗑️ Delete
          </button>

          {post.comments.length > 0 && (
            <div className={styles.comments}>
              <h4>Comments ({post.comments.length})</h4>
              {post.comments.map((c) => (
                <div key={c.id} className={styles.comment}>
                  <strong>{c.username || c.author}</strong>
                  <p>{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
