import React, { useEffect, useState } from "react";
import Net from "../components/Net";
import styles from "../styles/inf.module.css";
import { FaUser, FaUsers, FaEye, FaShare, FaCheckCircle } from "react-icons/fa";
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

  const checklist = [
    { text: "Kuba amaze kwandika inkuru zifite views 500 byibura", done: stats.views >= 500 },
    { text: "Kugira referral growth ≥30", done: stats.referrals >= 30 },
    { text: "Kwagura audience (total shares ≥300)", done: stats.shares >= 300 },
    { text: "Kuba inyangamugayo mu mikorere (kugendera ku mategeko ya New Talents stories group neza)", done: true },
    { text: "Guhora ukurikirana ibikorwa byawe, utanga inkuru nshya buri munsi", done: true },
  ];

  return (
    <div className={styles.container}>
      <Net />
      <div className={styles.card}>
        <h1 className={styles.title}><FaUser /> {username} - Net Influencer Level</h1>

        <div className={styles.levelSection}>
          <span className={styles.badge} style={getBadgeStyle()}>{level.toUpperCase()}</span>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: `${progress}%`, backgroundColor: getColor() }} />
          </div>
        </div>

        <div className={styles.stats}>
          <div><FaEye /> Views: {stats.views}</div>
          <div><FaUsers /> Referrals: {stats.referrals}</div>
          <div><FaShare /> Shares: {stats.shares}</div>
        </div>

        <h2 className={styles.checklistTitle}>Checklist for High Level</h2>
        <ul className={styles.checklist}>
          {checklist.map((item, idx) => (
            <li key={idx} className={styles.checkItem}>
              <FaCheckCircle color={item.done ? "green" : "#ccc"} />
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const usernameMatch = cookie.match(/username=([^;]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;

  if (!username) return { redirect: { destination: "/login", permanent: false } };

  let score = 0;
  let totalViews = 0;
  let referrals = 0;
  let sharesCount = 0;

  // Views
  const postsQuery = query(collection(db, "posts"), where("author", "==", username));
  const postsSnap = await getDocs(postsQuery);
  for (const post of postsSnap.docs) {
    totalViews += post.data().views || 0;
  }
  if (totalViews >= 500) score += 25;

  // Referrals
  const dataDoc = await getDoc(doc(db, "userdate", "data"));
  if (dataDoc.exists()) {
    const data = dataDoc.data();
    let myKey = null;
    for (const k in data) if (data[k].fName === username) { myKey = k; break; }
    if (myKey) {
      const code = data[myKey].referralCode;
      for (const k in data) if (data[k].referredBy === code) referrals++;
      if (referrals >= 30) score += 50;
    }
  }

  // Shares
  const sharesSnap = await getDocs(collection(db, "shares"));
  sharesSnap.forEach((docu) => {
    if (docu.id === username) {
      const data = docu.data();
      for (const key in data) sharesCount += data[key] || 0;
    }
  });
  if (sharesCount >= 300) score += 25;

  const stats = { views: totalViews, referrals, shares: sharesCount };

  return { props: { username, stats, score } };
}
