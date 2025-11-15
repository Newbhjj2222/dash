'use client';

import React from "react";
import styles from "@/styles/share.module.css";
import { db } from "@/components/firebase";
import { collection, getDocs, query, where, doc, updateDoc, increment, setDoc } from "firebase/firestore";
import Cookies from "js-cookie";

export default function SharePage({ posts, username }) {

  const handleShare = async (postId) => {
    if (!username) return;

    const shareDocRef = doc(db, "shares", username);
    try {
      await updateDoc(shareDocRef, {
        [postId]: increment(1)
      });
    } catch (err) {
      // Niba document itabaho, tureme
      await setDoc(shareDocRef, { [postId]: 1 });
    }

    const shareLink = `https://www.newtalentsg.co.rw/post/${postId}`;
    navigator.clipboard.writeText(shareLink);
    alert("Link copied: " + shareLink);
  };

  return (
    <div className={styles.container}>
      <h1>Share your posts</h1>
      {posts.length === 0 && <p>No posts found for {username}</p>}
      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.id} className={styles.item}>
            <span>{post.title}</span>
            <button onClick={() => handleShare(post.id)} className={styles.button}>
              Share
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// SSR: fata username muri cookies uhereye muri request headers
export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const usernameMatch = cookie.match(/username=([^;]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;

  if (!username) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  // Fetch inkuru z'umwanditsi
  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("author", "==", username));
  const querySnapshot = await getDocs(q);

  const posts = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    props: { posts, username },
  };
}
