import React, { useEffect, useState } from "react";
import { FaUser, FaUsers, FaEye, FaShare, FaCheckCircle } from "react-icons/fa";
import Net from "../components/Net";
import { db } from "../components/firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";

export default function NetInf({ username, stats, score }) {
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

  // ---------------- Checklist items ----------------
  const checklist = [
    { text: "Kuba amaze kwandika inkuru zifite views 500 byibura", done: stats.views >= 500 },
    { text: "Kugira referral growth ≥30", done: stats.referrals >= 30 },
    { text: "Kwagura audience (total shares ≥300)", done: stats.shares >= 300 },
    { text: "Kuba inyangamugayo mu mikorere (kugendera ku mategeko ya New Talents)", done: true },
    { text: "Guhora utera imbere (update ibikorwa byawe, inkuru nshya)", done: true },
  ];

  return (
    <div>
      <Net />
      <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaUser /> {username} - Net Influencer Level
        </h1>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginTop: "1rem"
        }}>
          <span style={{
            padding: "0.3rem 0.8rem",
            borderRadius: "12px",
            color: "#fff",
            fontWeight: "bold",
            ...getBadgeStyle()
          }}>
            {level.toUpperCase()}
          </span>

          <div style={{ flexGrow: 1, height: "20px", background: "#e5e7eb", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: getColor(),
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", marginTop: "1.5rem" }}>
          <div><FaEye /> Views: {stats.views}</div>
          <div><FaUsers /> Referrals: {stats.referrals}</div>
          <div><FaShare /> Shares: {stats.shares}</div>
        </div>

        <h2 style={{ marginTop: "2rem" }}>Checklist for High Level</h2>
        <ul>
          {checklist.map((item, idx) => (
            <li key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              {item.done ? <FaCheckCircle color="green" /> : <FaCheckCircle color="#ccc" />}
              {item.text}
            </li>
          ))}
        </ul>
      </div>
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
  let referrals = 0;
  let sharesCount = 0;

  // ---------------- 1️⃣ TOTAL VIEWS ----------------
  const postsQuery = query(collection(db, "posts"), where("author", "==", username));
  const postsSnap = await getDocs(postsQuery);
  for (const post of postsSnap.docs) {
    const p = post.data();
    totalViews += p.views || 0;
  }
  if (totalViews >= 500) score += 25;

  // ---------------- 2️⃣ REFERRALS ----------------
  const dataDoc = await getDoc(doc(db, "userdate", "data"));
  if (dataDoc.exists()) {
    const data = dataDoc.data();
    let myKey = null;
    for (const k in data) if (data[k].fName === username) { myKey = k; break; }
    if (myKey) {
      const code = data[myKey].referralCode;
      for (const k in data) if (data[k].referredBy === code) referrals++;
      if (referrals >= 30) score += 50; // Amanota 50
    }
  }

  // ---------------- 3️⃣ SHARES ----------------
  const sharesSnap = await getDocs(collection(db, "shares"));
  sharesSnap.forEach((s) => {
    const d = s.data();
    if (d.username === username) sharesCount += d.count || 0;
  });
  if (sharesCount >= 300) score += 25;

  const stats = { views: totalViews, referrals, shares: sharesCount };

  return { props: { username, stats, score } };
}
