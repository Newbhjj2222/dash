import React, { useEffect, useState } from "react";
import Net from "../components/Net";
import styles from "../styles/inf.module.css";
import { FaUser, FaUsers, FaEye, FaShare, FaCheckCircle } from "react-icons/fa";
import { db } from "../components/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";

/* ----------------- USERNAME SANITIZER ----------------- */
const sanitizeUsername = (value = "") => {
  try {
    let name = decodeURIComponent(value); // %20 -> space

    name = name
      .replace(/[^a-zA-Z0-9\s]/g, "") // kuramo %, $, @, +, n'ibindi
      .replace(/\s+/g, " ")           // space nyinshi -> imwe
      .trim();                        // kuramo space ku mpera

    return name;
  } catch {
    return value.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  }
};

export default function NetInf({ username, stats, score }) {
  const [level, setLevel] = useState("low");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let newLevel = "low";
    if (score >= 67) newLevel = "high";
    else if (score >= 34) newLevel = "middle";
    setLevel(newLevel);

    let interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= score) {
          clearInterval(interval);
          return score;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [score]);

  const checklist = [
    { text: "Kuba amaze kwandika inkuru zifite views 500 byibura", done: stats.views >= 500 },
    { text: "Kugira referral growth ≥30", done: stats.referrals >= 30 },
    { text: "Kwagura audience (total shares ≥300)", done: stats.shares >= 300 },
    { text: "Kuba inyangamugayo mu mikorere", done: true },
    { text: "Gutanga inkuru nshya buri munsi", done: true },
  ];

  const getBadgeStyle = () => {
    if (level === "low") return { backgroundColor: "#f87171" };
    if (level === "middle") return { backgroundColor: "#facc15", color: "#000" };
    if (level === "high") return { backgroundColor: "#34d399" };
    return {};
  };

  return (
    <div className={styles.container}>
      <Net />
      <div className={styles.card}>
        <h1 className={styles.title}>
          <FaUser /> {username} - Net Influencer Level
        </h1>

        <div className={styles.levelSection}>
          <span className={styles.badge} style={getBadgeStyle()}>
            {level.toUpperCase()}
          </span>

          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #f87171, #facc15, #34d399)",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {level.toUpperCase()}
            </div>
          </div>
        </div>

        <div className={styles.stats}>
          <div><FaEye /> Views: {stats.views}</div>
          <div><FaUsers /> Referrals: {stats.referrals}</div>
          <div><FaShare /> Shares: {stats.shares}</div>
        </div>

        <h2 className={styles.checklistTitle}>Checklist for High Level</h2>
        <ul className={styles.checklist}>
          {checklist.map((item, i) => (
            <li key={i} className={styles.checkItem}>
              <FaCheckCircle color={item.done ? "green" : "#ccc"} />
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ----------------- SERVER SIDE ----------------- */
export async function getServerSideProps(context) {
  const cookie = context.req.headers.cookie || "";
  const match = cookie.match(/username=([^;]+)/);
  if (!match) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const rawUsername = match[1];
  const username = sanitizeUsername(rawUsername);

  let score = 0;
  let totalViews = 0;
  let referrals = 0;
  let sharesCount = 0;

  /* -------- VIEWS -------- */
  const postsQuery = query(
    collection(db, "posts"),
    where("author", "==", username)
  );
  const postsSnap = await getDocs(postsQuery);

  postsSnap.forEach((p) => {
    totalViews += p.data().views || 0;
  });

  if (totalViews >= 500) score += 25;

  /* -------- REFERRALS -------- */
  const dataDoc = await getDoc(doc(db, "userdate", "data"));
  if (dataDoc.exists()) {
    const data = dataDoc.data();
    let myKey = null;

    for (const k in data) {
      if (sanitizeUsername(data[k].fName) === username) {
        myKey = k;
        break;
      }
    }

    if (myKey) {
      const code = data[myKey].referralCode;
      for (const k in data) {
        if (data[k].referredBy === code) referrals++;
      }
      if (referrals >= 30) score += 50;
    }
  }

  /* -------- SHARES -------- */
  const sharesSnap = await getDocs(collection(db, "shares"));
  sharesSnap.forEach((docu) => {
    if (sanitizeUsername(docu.id) === username) {
      Object.values(docu.data()).forEach((v) => {
        sharesCount += v || 0;
      });
    }
  });

  if (sharesCount >= 300) score += 25;

  return {
    props: {
      username,
      stats: {
        views: totalViews,
        referrals,
        shares: sharesCount,
      },
      score,
    },
  };
}
