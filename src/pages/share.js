'use client';

import React, { useEffect, useState } from "react";
import styles from "@/styles/share.module.css";
import { db } from "@/components/firebase";
import { collection, getDocs, query, where, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import Net from "@/components/Net";

export default function SharePage({ postsData = [], username = "", initialSharesCounts = {}, initialTotalShares = 0 }) {
  const [sharesCount, setSharesCount] = useState(initialSharesCounts || {});
  const [totalShares, setTotalShares] = useState(initialTotalShares || 0);
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    // Sync username from cookies if needed
    const raw = Cookies.get("username");
    if (raw) {
      const clean = decodeURIComponent(raw);
      console.log("Decoded username:", clean);
    }
  }, []);

  // ================================
  // Handle sharing
  // ================================
  const handleShare = async (postId, head, summary) => {
    if (!username) {
      setMessage("No username found. Please login.");
      setMessageVisible(true);
      setTimeout(() => setMessageVisible(false), 4000);
      return;
    }

    const shareDocRef = doc(db, "shares", username);
    const shareLink = `https://www.newtalentsg.co.rw/post/${postId}`;
    let copied = false;

    try {
      await navigator.clipboard.writeText(`Title: ${head}\nSummary: ${summary}\nLink: ${shareLink}`);
      copied = true;
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = `Title: ${head}\nSummary: ${summary}\nLink: ${shareLink}`;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        copied = true;
      } catch (err) {
        copied = false;
      }
    }

    setMessage(
      copied
        ? `✅ Link copied successfully!\n\nTitle: ${head}\nSummary: ${summary}\nLink: ${shareLink}`
        : `❌ Failed to copy link.\n\nTitle: ${head}\nSummary: ${summary}\nLink: ${shareLink}`
    );
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
      setMessage("");
    }, 6000);

    // Update shares count in Firestore
    try {
      await updateDoc(shareDocRef, { [postId]: increment(1) });
    } catch (err) {
      await setDoc(shareDocRef, { [postId]: 1 }, { merge: true });
    }

    // Local update
    setSharesCount((prev) => ({
      ...prev,
      [postId]: prev[postId] ? prev[postId] + 1 : 1
    }));

    setTotalShares((t) => t + 1);
  };

  return (
    <>
      <Net />
      <div className={styles.pageWrap}>
        {messageVisible && (
          <div className={styles.topMessage} role="status" aria-live="polite">
            <pre className={styles.messagePre}>{message}</pre>
          </div>
        )}

        <main className={styles.container}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Share your posts</h1>

            <div className={styles.totalCard} aria-hidden={false}>
              <div className={styles.totalLabel}>Total shares by you</div>
              <div className={styles.totalNumber}>{totalShares}</div>
            </div>
          </div>

          {postsData.length === 0 ? (
            <p className={styles.noPosts}>No posts found for <strong>{username}</strong></p>
          ) : (
            <ul className={styles.list}>
              {postsData.map((post) => (
                <li key={post.id} className={styles.item}>
                  <div className={styles.postInfo}>
                    <h3 className={styles.postHead}>{post.head}</h3>
                    <p className={styles.postSummary}>{post.storySummary}</p>

                    <div className={styles.metaRow}>
                      <span className={styles.shareCount}>Shares: {sharesCount[post.id] || 0}</span>

                      <a
                        className={styles.viewLink}
                        href={`https://www.newtalentsg.co.rw/post/${post.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Post
                      </a>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      onClick={() => handleShare(post.id, post.head, post.storySummary)}
                      className={styles.button}
                      aria-label={`Copy link for ${post.head}`}
                    >
                      Copy Link
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </>
  );
}

// ================================
// SSR SECTION (FULLY UPDATED)
// ================================
export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";

  const usernameMatch = cookie.match(/username=([^;]+)/);
  const rawUsername = usernameMatch ? usernameMatch[1] : null;

  // Decode username correctly to remove %20 %24 %2F etc.
  const username = rawUsername ? decodeURIComponent(rawUsername) : null;

  if (!username) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // Fetch posts for this author
  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("author", "==", username));
  const querySnapshot = await getDocs(q);

  const stripHtml = (html) => {
    if (!html) return "";
    const text = String(html).replace(/<[^>]*>/g, " ");
    const collapsed = text.replace(/\s+/g, " ").trim();
    return collapsed.length <= 300 ? collapsed : collapsed.slice(0, 300).trim() + "...";
  };

  const toMs = (dateValue) => {
    if (!dateValue) return 0;
    if (typeof dateValue === "object" && dateValue !== null && "seconds" in dateValue) {
      return (dateValue.seconds || 0) * 1000 + (dateValue.nanoseconds ? Math.floor(dateValue.nanoseconds / 1e6) : 0);
    }
    if (typeof dateValue === "string") return new Date(dateValue).getTime() || 0;
    if (typeof dateValue === "number") return dateValue < 1e12 ? dateValue * 1000 : dateValue;
    return 0;
  };

  let postsData = querySnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      head: data.head || data.title || "Untitled",
      storySummary: stripHtml(data.story),
      createdAt: data.createdAt || data.created_at || data.date || null
    };
  });

  postsData.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  // Fetch shares document
  const sharesRef = doc(db, "shares", username);
  let initialSharesCounts = {};
  let initialTotalShares = 0;

  try {
    const sharesSnap = await getDoc(sharesRef);
    if (sharesSnap.exists()) {
      initialSharesCounts = sharesSnap.data() || {};
      initialTotalShares = Object.values(initialSharesCounts).reduce((acc, val) => {
        const n = typeof val === "number" ? val : parseInt(val, 10) || 0;
        return acc + n;
      }, 0);
    }
  } catch (err) {
    initialSharesCounts = {};
    initialTotalShares = 0;
  }

  return { props: { postsData, username, initialSharesCounts, initialTotalShares } };
}
