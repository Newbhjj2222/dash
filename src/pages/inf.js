import React, { useEffect, useState } from "react";
import { FaUser, FaUsers, FaEye, FaShare } from "react-icons/fa";
import { db } from "../components/firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";

export default function Netinf({ username, stats, score }) {
  const [level, setLevel] = useState("low");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // SET LEVEL
    let newLevel = "low";
    if (score >= 67) newLevel = "high";
    else if (score >= 34) newLevel = "middle";
    setLevel(newLevel);

    // Animate progress
    let interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= score) { clearInterval(interval); return score; }
        return prev + 1;
      });
    }, 20);
  }, [score]);

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

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <div><FaEye /> Views: {stats.views}</div>
        <div><FaUsers /> Referrals: {stats.referrals}</div>
        <div><FaUser /> Comments: {stats.hasComments ? "Yes" : "No"}</div>
        <div><FaShare /> Shares: {stats.shares}</div>
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

// ---------------- SSR ----------------
export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const usernameMatch = cookie.match(/username=([^;]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;

  if (!username) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  let score = 0;
  let totalViews = 0;
  let hasComments = false;
  let referrals = 0;
  let sharesCount = 0;

  // ---------------- 1️⃣ TOTAL VIEWS & COMMENTS ----------------
  const postsQuery = query(collection(db, "posts"), where("author", "==", username));
  const postsSnap = await getDocs(postsQuery);
  for (const post of postsSnap.docs) {
    const p = post.data();
    totalViews += p.views || 0;

    const commentsSnap = await getDocs(collection(db, "posts", post.id, "comments"));
    if (!commentsSnap.empty) hasComments = true;
  }
  if (totalViews >= 500) score += 25;
  if (hasComments) score += 25;

  // ---------------- 2️⃣ REFERRALS ----------------
  const dataDoc = await getDoc(doc(db, "userdate", "data"));
  if (dataDoc.exists()) {
    const data = dataDoc.data();
    let myKey = null;
    for (const k in data) if (data[k].fName === username) { myKey = k; break; }
    if (myKey) {
      const code = data[myKey].referralCode;
      for (const k in data) if (data[k].referredBy === code) referrals++;
      if (referrals >= 30) score += 25;
    }
  }

  // ---------------- 3️⃣ SHARES ----------------
  const sharesSnap = await getDocs(collection(db, "shares"));
  sharesSnap.forEach((s) => {
    const d = s.data();
    if (d.username === username) sharesCount += d.count || 0;
  });
  if (sharesCount >= 150) score += 25;

  const stats = { views: totalViews, hasComments, referrals, shares: sharesCount };

  return { props: { username, stats, score } };
}
