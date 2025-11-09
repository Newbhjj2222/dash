// components/Card.js
import React from "react";
import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import * as cookie from "cookie";

export default function Card({ totalComments }) {
  return (
    <div style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
      textAlign: "center",
      width: "150px",
      margin: "10px"
    }}>
      <h3>Total Comments</h3>
      <p style={{ fontSize: "24px", fontWeight: "bold", color: "#111" }}>
        {totalComments}
      </p>
    </div>
  );
}

// Fungura method yo gukoresha SSR
export async function getServerSideProps(context) {
  const cookieHeader = context.req?.headers?.cookie || "";
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const username = cookies.username || null;

  if (!username) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("author", "==", username));
  const snapshot = await getDocs(q);

  let totalComments = 0;
  for (const docSnap of snapshot.docs) {
    const commentsRef = collection(db, "posts", docSnap.id, "comments");
    const commentsSnap = await getDocs(commentsRef);
    totalComments += commentsSnap.size;
  }

  if (totalComments > 20) totalComments = 20;

  return { props: { totalComments } };
}
