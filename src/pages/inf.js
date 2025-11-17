'use client';

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { FaUser } from "react-icons/fa";
import { db } from "../components/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

export default function Netinf() {
  const [level, setLevel] = useState("low");
  const [progress, setProgress] = useState(0);

  const [loading, setLoading] = useState(true);

  // ---------------------------
  //  FUNCTION TO CALCULATE LEVEL
  // ---------------------------
  const calculateLevel = async () => {
    const username = Cookies.get("username");
    if (!username) return;

    let score = 0;

    // ---------------------------
    // 1. TOTAL VIEWS ≥ 500
    // ---------------------------
    let totalViews = 0;
    const postsSnapshot = await getDocs(collection(db, "posts"));

    postsSnapshot.forEach((post) => {
      const p = post.data();
      if (p.username === username) {
        totalViews += p.views || 0;
      }
    });

    if (totalViews >= 500) score += 25;

    // ---------------------------
    // 2. COMMENTS: check at least 1 post with comments
    // ---------------------------
    let hasComments = false;
    for (const post of postsSnapshot.docs) {
      const postId = post.id;

      const commentsRef = collection(db, "posts", postId, "comments");
      const commentsSnap = await getDocs(commentsRef);

      if (!commentsSnap.empty) {
        hasComments = true;
        break;
      }
    }

    if (hasComments) score += 25;

    // ---------------------------
    // 3. REFERRALS ≥ 30
    // ---------------------------
    const dataDocRef = doc(db, "userdate", "data");
    const refSnap = await getDoc(dataDocRef);

    if (refSnap.exists()) {
      const data = refSnap.data();

      let userKey = null;
      for (const k in data) {
        if (data[k].fName === username) {
          userKey = k;
          break;
        }
      }

      if (userKey) {
        let myCode = data[userKey].referralCode;
        let refCount = 0;

        for (const k in data) {
          if (data[k].referredBy === myCode) {
            refCount++;
          }
        }

        if (refCount >= 30) score += 25;
      }
    }

    // ---------------------------
    // 4. SHARES ≥ 150
    // ---------------------------
    let shareCount = 0;
    const sharesSnap = await getDocs(collection(db, "shares"));
    sharesSnap.forEach((docu) => {
      const s = docu.data();
      if (s.username === username) {
        shareCount += s.count || 0;
      }
    });

    if (shareCount >= 150) score += 25;

    // ---------------------------
    // SET LEVEL
    // ---------------------------
    if (score <= 33) setLevel("low");
    else if (score <= 66) setLevel("middle");
    else setLevel("high");

    // SAVE IN COOKIES
    Cookies.set("userLevel", level);

    animateProgress(score);
    setLoading(false);
  };

  // ---------------------------
  // Progress animation
  // ---------------------------
  const animateProgress = (target) => {
    let current = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= target) {
          clearInterval(interval);
          return target;
        }
        return prev + 1;
      });
    }, 20);
  };

  useEffect(() => {
    calculateLevel();
  }, []);

  const getColor = () => {
    if (level === "low") return "#f87171";
    if (level === "middle") return "#facc15";
    if (level === "high") return "#34d399";
    return "#ccc";
  };

  const getBadgeStyle = () => {
    if (level === "low") return { backgroundColor: "#f87171" };
    if (level === "middle") return { backgroundColor: "#facc15", color: "#000" };
    if (level === "high") return { backgroundColor: "#34d399" };
    return {};
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <FaUser size={32} />
        <h1>User Level</h1>
        <span style={{
          padding: "0.3rem 0.8rem",
          borderRadius: "12px",
          color: "#fff",
          fontWeight: "bold",
          ...getBadgeStyle()
        }}>
          {level.toUpperCase()}
        </span>
      </div>

      <div style={{
        marginTop: "1rem",
        width: "100%",
        height: "30px",
        backgroundColor: "#e5e7eb",
        borderRadius: "5px",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          backgroundColor: getColor(),
          transition: "width 0.3s ease"
        }} />
      </div>

      <p style={{ marginTop: "1rem" }}>Progress: {progress}%</p>
    </div>
  );
}
