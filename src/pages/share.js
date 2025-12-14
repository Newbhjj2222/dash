'use client';

import React, { useEffect, useState } from "react";
import styles from "@/styles/share.module.css";
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
  getDoc,
} from "firebase/firestore";
import Cookies from "js-cookie";
import Net from "@/components/Net";

/* ================================
   USERNAME SANITIZER (GLOBAL)
================================ */
const sanitizeUsername = (value = "") => {
  try {
    let name = decodeURIComponent(value);
    name = name
      .replace(/[^a-zA-Z0-9\s]/g, "") // %, $, @, +
      .replace(/\s+/g, " ")
      .trim();
    return name;
  } catch {
    return value.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  }
};

export default function SharePage({
  username,
  postsData = [],
  initialSharesCounts = {},
  initialTotalShares = 0,
}) {
  const cleanUsername = sanitizeUsername(username);

  const [sharesCount, setSharesCount] = useState(initialSharesCounts);
  const [totalShares, setTotalShares] = useState(initialTotalShares);
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);

  /* ---------------- DEBUG (optional) ---------------- */
  useEffect(() => {
    const raw = Cookies.get("username");
    if (raw) {
      console.log("Raw cookie:", raw);
      console.log("Sanitized:", sanitizeUsername(raw));
    }
  }, []);

  /* ================================
     COPY & SHARE HANDLER
  ================================ */
  const handleShare = async (postId, head, summary) => {
    if (!cleanUsername) {
      showTempMessage("❌ No username found. Please login.");
      return;
    }

    const shareDocRef = doc(db, "shares", cleanUsername);
    const shareLink = `www.newtalentsg.co.rw/post/${postId}`;
    const textToCopy = `${head}\n ${summary}\nkanda aha usome iyi Nkuru yose: ${shareLink}`;

    let copied = false;

    try {
      await navigator.clipboard.writeText(textToCopy);
      copied = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        copied = true;
      } catch {
        copied = false;
      }
    }

    showTempMessage(
      copied
        ? `✅ Link copied successfully!\n\n${textToCopy}`
        : `❌ Failed to copy link.\n\n${textToCopy}`,
      6000
    );

    /* -------- FIRESTORE UPDATE -------- */
    try {
      await updateDoc(shareDocRef, { [postId]: increment(1) });
    } catch {
      await setDoc(shareDocRef, { [postId]: 1 }, { merge: true });
    }

    /* -------- LOCAL STATE -------- */
    setSharesCount((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1,
    }));
    setTotalShares((t) => t + 1);
  };

  const showTempMessage = (msg, duration = 4000) => {
    setMessage(msg);
    setMessageVisible(true);
    setTimeout(() => setMessageVisible(false), duration);
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

            <div className={styles.totalCard}>
              <div className={styles.totalLabel}>Total shares by you</div>
              <div className={styles.totalNumber}>{totalShares}</div>
            </div>
          </div>

          {postsData.length === 0 ? (
            <p className={styles.noPosts}>
              No posts found for <strong>{cleanUsername}</strong>
            </p>
          ) : (
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
                        View Post
                      </a>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      onClick={() =>
                        handleShare(post.id, post.head, post.storySummary)
                      }
                      className={styles.button}
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

/* ================================
   SERVER SIDE
================================ */
export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const match = cookie.match(/username=([^;]+)/);

  if (!match) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const username = sanitizeUsername(match[1]);

  /* -------- FETCH POSTS -------- */
  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("author", "==", username));
  const snap = await getDocs(q);

  const stripHtml = (html = "") =>
    String(html)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300) + "...";

  const toMs = (d) =>
    d?.seconds
      ? d.seconds * 1000
      : typeof d === "number"
      ? d
      : new Date(d).getTime() || 0;

  let postsData = snap.docs.map((docu) => {
    const d = docu.data();
    return {
      id: docu.id,
      head: d.head || d.title || "Untitled",
      storySummary: stripHtml(d.story),
      createdAt: d.createdAt || d.date || null,
    };
  });

  postsData.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  /* -------- FETCH SHARES -------- */
  const sharesRef = doc(db, "shares", username);
  let initialSharesCounts = {};
  let initialTotalShares = 0;

  const sharesSnap = await getDoc(sharesRef);
  if (sharesSnap.exists()) {
    initialSharesCounts = sharesSnap.data();
    initialTotalShares = Object.values(initialSharesCounts).reduce(
      (a, b) => a + (Number(b) || 0),
      0
    );
  }

  return {
    props: {
      username,
      postsData,
      initialSharesCounts,
      initialTotalShares,
    },
  };
    }
