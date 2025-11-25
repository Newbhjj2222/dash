import { useState } from "react";
import { db } from "@/components/firebase";
import { collection, doc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import styles from "@/styles/manage.module.css";
import Net from "@/components/Net";
import Cookies from "js-cookie";

export default function ManagePage({ initialNews, username }) {
  const [newsList, setNewsList] = useState(initialNews);

  // Clean content: remove HTML tags
  function cleanText(html) {
  if (!html) return "";

  let text = html;

  // 1. Convert HTML entities (nbsp, amp, quot, etc.)
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&lt;/gi, "<");
  text = text.replace(/&gt;/gi, ">");
  text = text.replace(/&#39;/gi, "'");

  // Remove any remaining entities like &#123; or &something;
  text = text.replace(/&[#A-Za-z0-9]+;/g, " ");

  // 2. Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // 3. Replace multiple spaces with single space
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

  // Delete post
  const handleDelete = async (id) => {
    if (!confirm("Urashaka koko gusiba iyi post?")) return;

    setNewsList(prev =>
      prev.map(n => n.id === id ? { ...n, visible: false } : n)
    );

    setTimeout(async () => {
      await deleteDoc(doc(db, "news", id));
      setNewsList(prev => prev.filter(n => n.id !== id));
    }, 300);
  };

  return (
    <>
      <Net />
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Manage Your Posts</h1>

        {newsList.length === 0 ? (
          <p>No posts found for user "{username}"</p>
        ) : (
          <div className={styles.newsGrid}>
            {newsList.map(news => (
              <div
                key={news.id}
                className={`${styles.newsCard} ${!news.visible ? styles.fadeOut : ""}`}
              >
                <p className={styles.author}>
                  <strong>Author:</strong> {news.author}
                </p>

                <h2 className={styles.title}>{news.title}</h2>

                {news.imageUrl && (
                  <img src={news.imageUrl} alt={news.title} className={styles.image} />
                )}

                {/* Show content WITHOUT HTML tags */}
                <p className={styles.content}>
                  {cleanText(news.content)}
                </p>

                <div className={styles.actions}>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(news.id)}>
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}


// SSR: Fetch posts authored by username
export async function getServerSideProps(context) {
  let username = "";

  if (context.req.headers.cookie) {
    const match = context.req.headers.cookie
      .split(";")
      .find(c => c.trim().startsWith("username="));
    if (match) {
      username = decodeURIComponent(match.split("=")[1]);
    }
  }

  const newsRef = collection(db, "news");
  let newsQuery = newsRef;

  if (username) {
    newsQuery = query(newsRef, where("author", "==", username));
  }

  const snapshot = await getDocs(newsQuery);
  const newsData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    visible: true,
  }));

  return { props: { initialNews: newsData, username } };
}
