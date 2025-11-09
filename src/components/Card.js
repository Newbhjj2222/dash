// components/Card.js
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Card ikora Client Side
export default function Card() {
  const [totalComments, setTotalComments] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComments() {
      try {
        // Fata username muri cookies
        const username = document.cookie
          .split("; ")
          .find((c) => c.startsWith("username="))
          ?.split("=")[1];

        if (!username) return;

        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("author", "==", username));
        const snapshot = await getDocs(q);

        let count = 0;
        for (const docSnap of snapshot.docs) {
          const commentsRef = collection(db, "posts", docSnap.id, "comments");
          const commentsSnap = await getDocs(commentsRef);
          count += commentsSnap.size;
        }

        setTotalComments(count);
      } catch (err) {
        console.error("Error fetching total comments:", err);
        setTotalComments(0);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, []);

  return (
    <div style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
      textAlign: "center",
      width: "180px",
      margin: "10px"
    }}>
      <h3>Total Comments</h3>
      <p style={{ fontSize: "24px", fontWeight: "bold", color: "#111" }}>
        {loading ? "Loading..." : totalComments}
      </p>
    </div>
  );
}
