'use client';

import React, { useEffect, useState } from "react";
import styles from "@/styles/share.module.css";
import { db } from "@/components/firebase";
import { collection, getDocs, query, where, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";

export default function SharePage({ postsData, username }) {
  const [sharesCount, setSharesCount] = useState({});

  useEffect(() => {
    // Fetch shares count muri Firestore
    const fetchShares = async () => {
      const sharesRef = doc(db, "shares", username);
      const sharesSnap = await getDoc(sharesRef);
      if (sharesSnap.exists()) {
        setSharesCount(sharesSnap.data());
      }
    };
    fetchShares();
  }, [username]);

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

    // Update state y'uburyo instant
    setSharesCount((prev) => ({
      ...prev,
      [postId]: prev[postId] ? prev[postId] + 1 : 1
    }));

    // Copy link muri clipboard
    const shareLink = `https://www.newtalentsg.co.rw/post/${postId}`;
    navigator.clipboard.writeText(shareLink);
    alert("Link copied: " + shareLink);
  };

  return (
    <div className={styles.container}>
      <h1>Share your posts</h1>
      {postsData.length === 0 && <p>No posts found for {username}</p>}
      <ul className={styles.list}>
        {postsData.map((post) => (
          <li key={post.id} className={styles.item}>
            <div>
              <h3>{post.head}</h3> {/* Erekana head/title */}
              <p>Shares: {sharesCount[post.id] || 0}</p>
            </div>
            <button onClick={() => handleShare(post.id)} className={styles.button}>
              Copy Link
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// SSR
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

  const postsData = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    head: doc.data().head || doc.data().title || "Untitled"
  }));

  return {
    props: { postsData, username },
  };
}
