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

export default function SharePage({
  postsData = [],
  username = "",
  initialSharesCounts = {},
  initialTotalShares = 0
}) {
  const [sharesCount, setSharesCount] = useState(initialSharesCounts || {});
  const [totalShares, setTotalShares] = useState(initialTotalShares || 0);
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    const clientUser = Cookies.get("username");
  }, []);

  // ===========================
  // COPY FULL POST CONTENT
  // ===========================
  const handleShare = async (postId, head, summary) => {
    if (!username) {
      setMessage("No username found. Please login.");
      setMessageVisible(true);
      setTimeout(() => setMessageVisible(false), 4000);
      return;
    }

    // ===========================
    // FIREBASE USER SHARE COUNTER
    // ===========================
    const shareDocRef = doc(db, "shares", username);

    try {
      await updateDoc(shareDocRef, {
        [postId]: increment(1),
      });
    } catch (err) {
      await setDoc(shareDocRef, { [postId]: 1 }, { merge: true });
    }

    // UI UPDATE
    setSharesCount((prev) => ({
      ...prev,
      [postId]: prev[postId] ? prev[postId] + 1 : 1,
    }));

    setTotalShares((t) => t + 1);

    // =====================================
    // CONTENT TO COPY TO CLIPBOARD
    // =====================================
    const link = `https://www.newtalentsg.co.rw/s/${postId}`;

    const content = `📌 ${head}\n\n📝 Summary:\n${summary}\n\n🔗 Link:\n${link}`;

    // COPY
    try {
      await navigator.clipboard.writeText(content);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }

    // SMALL POPUP MESSAGE
    setMessage("Full post content copied!");
    setMessageVisible(true);
    setTimeout(() => {
      setMessageVisible(false);
      setMessage("");
    }, 4000);
  };

  return (
    <>
      <div className={styles.pageWrap}>
        {messageVisible && (
          <div className={styles.topMessage} role="status">
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
              No posts found for <strong>{username}</strong>
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
                        href={`https://www.newtalentsg.co.rw/s/${post.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Link
                      </a>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      onClick={() =>
                        handleShare(
                          post.id,
                          post.head,
                          post.storySummary
                        )
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

// ================================
// SSR
// ================================
export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const usernameMatch = cookie.match(/username=([^;]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;

  if (!username) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("author", "==", username));
  const querySnapshot = await getDocs(q);

  const stripHtml = (html) => {
    if (!html) return "";
    const text = String(html).replace(/<[^>]*>/g, " ");
    const collapsed = text.replace(/\s+/g, " ").trim();
    return collapsed.length <= 300
      ? collapsed
      : collapsed.slice(0, 300).trim() + "...";
  };

  const toMs = (v) => {
    if (!v) return 0;
    if (typeof v === "object" && "seconds" in v) {
      return v.seconds * 1000 + Math.floor(v.nanoseconds / 1e6 || 0);
    }
    if (typeof v === "string") return new Date(v).getTime() || 0;
    if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
    return 0;
  };

  let postsData = querySnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      head: data.head || "Untitled",
      storySummary: stripHtml(data.story),
      createdAt: data.createdAt || data.created_at || data.date || null,
    };
  });

  postsData.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  const sharesRef = doc(db, "shares", username);
  let initialSharesCounts = {};
  let initialTotalShares = 0;

  try {
    const snap = await getDoc(sharesRef);
    if (snap.exists()) {
      initialSharesCounts = snap.data() || {};
      initialTotalShares = Object.values(initialSharesCounts).reduce(
        (a, b) => a + (parseInt(b, 10) || 0),
        0
      );
    }
  } catch (err) {}

  return {
    props: {
      postsData,
      username,
      initialSharesCounts,
      initialTotalShares,
    },
  };
}
