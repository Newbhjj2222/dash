import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import * as cookie from "cookie";
import styles from "@/styles/freema.module.css";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/components/firebase";

/* ======================
   SSR
====================== */
export async function getServerSideProps(context) {
  const cookies = cookie.parse(context.req.headers.cookie || "");
  const username = cookies.username || null;

  if (!username) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  try {
    const q = query(
      collection(db, "free"),
      where("author", "==", username),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    const initialPosts = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        head: data.head || "",
        story: data.story || "",
        imageUrl: data.imageUrl || null,
        createdAt: data.createdAt || null,
        comments: [],
        commentsLoaded: false,
      };
    });

    return {
      props: {
        username,
        initialPosts,
      },
    };
  } catch (err) {
    console.error("SSR fetch error:", err);

    // 🛡️ fallback safe
    return {
      props: {
        username,
        initialPosts: [],
      },
    };
  }
}

/* ======================
   CLIENT
====================== */
export default function Freema({ username, initialPosts }) {
  const router = useRouter();

  const [posts, setPosts] = useState(initialPosts);
  const [loadingComments, setLoadingComments] = useState({});

  /* ======================
     LOAD COMMENTS (CLIENT)
  ====================== */
  useEffect(() => {
    const loadComments = async () => {
      for (const post of posts) {
        if (post.commentsLoaded) continue;

        setLoadingComments((p) => ({ ...p, [post.id]: true }));

        try {
          const snap = await getDocs(
            collection(db, "free", post.id, "comments")
          );

          const comments = snap.docs.map((c) => ({
            id: c.id,
            ...c.data(),
          }));

          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    comments,
                    commentsLoaded: true,
                  }
                : p
            )
          );
        } catch (err) {
          console.error("Comments error:", err);
        } finally {
          setLoadingComments((p) => ({ ...p, [post.id]: false }));
        }
      }
    };

    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ======================
     DELETE
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

  /* ======================
     RENDER
  ====================== */
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
            onClick={() => deletePost(post.id)}
            className={styles.delete}
          >
            🗑️ Delete
          </button>

          <div className={styles.comments}>
            <h4>
              Comments{" "}
              {loadingComments[post.id] ? "(Loading...)" : ""}
            </h4>

            {post.comments?.map((c) => (
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
