'use client';

import React, { useEffect, useState } from "react";
import styles from "@/styles/share.module.css";
import Net from "@/components/Net";
import { db } from "@/components/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  increment,
  setDoc,
  getDoc
} from "firebase/firestore";
import Cookies from "js-cookie";

export default function SharePage({ postsData, username, initialSharesCounts, initialTotalShares }) {
  const [sharesCount, setSharesCount] = useState(initialSharesCounts || {});
  const [totalShares, setTotalShares] = useState(initialTotalShares || 0);
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);

  const handleShare = async (postId, summary) => {
    if (!username) return;

    const shareDocRef = doc(db, "shares", username);

    try {
      await updateDoc(shareDocRef, {
        [postId]: increment(1)
      });
    } catch (err) {
      await setDoc(shareDocRef, { [postId]: 1 }, { merge: true });
    }

    setSharesCount((prev) => {
      const next = { ...prev, [postId]: prev[postId] ? prev[postId] + 1 : 1 };
      return next;
    });
    setTotalShares((t) => t + 1);

    const shareLink = `https://www.newtalentsg.co.rw/post/${postId}`;

    try {
      await navigator.clipboard.writeText(shareLink);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = shareLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }

    const display = `Link copied: ${shareLink}\n\nSummary: ${summary}`;
    setMessage(display);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
      setMessage("");
    }, 6000);
  };

  return (
    <>
      <Net />

      <div className={styles.pageWrap}>
        {messageVisible && (
          <div className={styles.topMessage} role="status">
            <pre className={styles.messagePre}>{message}</pre>
          </div>
        )}

        <div className={styles.container}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Share your posts</h1>

            <div className={styles.totalCard}>
              <div className={styles.totalLabel}>Total shares by you</div>
              <div className={styles.totalNumber}>{totalShares}</div>
            </div>
          </div>

          {postsData.length === 0 && (
            <p className={styles.noPosts}>No posts found for {username}</p>
          )}

          <ul className={styles.list}>
            {postsData.map((post) => (
              <li key={post.id} className={styles.item}>
                <div className={styles.postInfo}>
                  <h3 className={styles.postHead}>{post.head}</h3>
                  <p className={styles.postSummary}>{post.storySummary}</p>

                  <div className={styles.metaRow}>
                    <span className={styles.shareCount}>
                      Shares: {sharesCount[post.id] || 0}
                    </span>

                    <a
                      className={styles.viewLink}
                      href={`https://www.newtalentsg.co.rw/post/${post.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    onClick={() => handleShare(post.id, post.storySummary)}
                    className={styles.button}
                  >
                    Copy Link
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

// ================================
// SSR SECTION
// ================================

export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const usernameMatch = cookie.match(/username=([^;]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;

  if (!username) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("author", "==", username));
  const querySnapshot = await getDocs(q);

  // Clean summary function
  const stripHtml = (html) => {
    if (!html) return "";
    const text = String(html)
      .replace(/<[^>]*>/g, " ") 
      .replace(/\s+/g, " ")
      .trim();

    return text.length <= 300 ? text : text.slice(0, 300).trim() + "...";
  };

  let postsData = querySnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      head: data.head || data.title || "Untitled",
      createdAt: data.createdAt || null,
      storySummary: stripHtml(data.story)
    };
  });

  // 🔥 SORT POSTS BY NEWEST (createdAt)
  postsData.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return b.createdAt.seconds - a.createdAt.seconds;
  });

  // Load shares doc
  const sharesRef = doc(db, "shares", username);
  let initialSharesCounts = {};
  let initialTotalShares = 0;

  try {
    const sharesSnap = await getDoc(sharesRef);
    if (sharesSnap.exists()) {
      initialSharesCounts = sharesSnap.data() || {};

      initialTotalShares = Object.values(initialSharesCounts).reduce(
        (acc, val) => acc + (typeof val === "number" ? val : parseInt(val, 10) || 0),
        0
      );
    }
  } catch (err) {
    initialSharesCounts = {};
    initialTotalShares = 0;
  }

  return {
    props: {
      postsData,
      username,
      initialSharesCounts,
      initialTotalShares
    },
  };
}
