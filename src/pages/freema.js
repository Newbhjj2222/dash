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
import * as cookie from "cookie";

export async function getServerSideProps(context) {
  const cookies = cookie.parse(context.req.headers.cookie || "");
  const username = cookies.username || null;

  if (!username) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const db = getFirestore(app);
  const ref = collection(db, "free");

  const q = query(ref, where("author","==",username), orderBy("createdAt","desc"));
  const snap = await getDocs(q);

  const posts = [];

  for (const docSnap of snap.docs) {
    const commentsSnap = await getDocs(collection(db, "free", docSnap.id, "comments"));
    posts.push({
      id: docSnap.id,
      ...docSnap.data(),
      comments: commentsSnap.docs.map(c=>({id:c.id,...c.data()}))
    });
  }

  return {
    props: { initialPosts: posts, username },
  };
}

export default function Freema({ initialPosts, username }) {
  const router = useRouter();
  const db = getFirestore(app);

  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);

  const deletePost = async (postId) => {
    if (!confirm("Uremeza gusiba iyi post burundu?")) return;
    try {
      const commentsSnap = await getDocs(collection(db, "free", postId, "comments"));
      for (const c of commentsSnap.docs) {
        await deleteDoc(doc(db, "free", postId, "comments", c.id));
      }
      await deleteDoc(doc(db, "free", postId));
      setPosts(prev => prev.filter(p=>p.id!==postId));
    } catch(err) {
      console.error(err);
      alert("Gusiba byanze");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Freema Posts</h1>
      <p>Logged in as <strong>{username}</strong></p>

      {posts.length===0 && <p>Nta post urashyiramo</p>}

      {posts.map(post=>(
        <div key={post.id} className={styles.post}>
          <h2>{post.head}</h2>
          {post.imageUrl && <img src={post.imageUrl} className={styles.image} />}
          <div dangerouslySetInnerHTML={{__html:post.story}} className={styles.story}/>
          <button onClick={()=>deletePost(post.id)} className={styles.delete}>🗑️ Delete</button>
          <div className={styles.comments}>
            <h4>Comments ({post.comments.length})</h4>
            {post.comments.map(c=>(
              <div key={c.id} className={styles.comment}>
                <strong>{c.username || c.author}</strong>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
