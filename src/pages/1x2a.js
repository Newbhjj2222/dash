"use client";

import React, { useState } from "react";
import styles from "../components/1x2a.module.css";
import { db } from "../components/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function getServerSideProps() {
  // Firestore read all documents
  const querySnapshot = await getDocs(collection(db, "monetization_requests"));
  const requests = querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate?.().toISOString() || null,
  }));

  return { props: { initialRequests: requests } };
}

export default function AdminRequests({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Uremeza ko ushaka gusiba iyi request?");
    if (!confirmDelete) return;

    try {
      setDeleting(id);
      await deleteDoc(doc(db, "monetization_requests", id));
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      console.error(err);
      setError(`Firestore Error: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Monetization Requests</h2>
      {error && <p className={styles.error}>{error}</p>}

      {requests.length === 0 ? (
        <p className={styles.empty}>Nta requests zirimo muri database.</p>
      ) : (
        <div className={styles.grid}>
          {requests.map((req) => (
            <div key={req.id} className={styles.card}>
              <h3>{req.fullName}</h3>
              <p><strong>Username:</strong> {req.username}</p>
              <p><strong>WhatsApp:</strong> {req.whatsapp}</p>
              <p><strong>Email:</strong> {req.email}</p>
              <p><strong>Reason:</strong> {req.reason}</p>
              <p><strong>Date:</strong> {req.createdAt || "N/A"}</p>

              <div className={styles.images}>
                {req.idCardUrl && <img src={req.idCardUrl} alt="ID" />}
                {req.profilePhotoUrl && <img src={req.profilePhotoUrl} alt="Profile" />}
                {req.screenshotStoriesUrl && <img src={req.screenshotStoriesUrl} alt="Stories" />}
                {req.screenshotReferUrl && <img src={req.screenshotReferUrl} alt="Refer" />}
              </div>

              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(req.id)}
                disabled={deleting === req.id}
              >
                {deleting === req.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
