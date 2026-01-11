import { collection, getDocs } from "firebase/firestore";
import { db } from "@/components/firebase";
import styles from "@/styles/manager.module.css";

export async function getServerSideProps() {
  const snap = await getDocs(collection(db, "posts"));

  let posts = [];
  snap.forEach((doc) => {
    posts.push({ id: doc.id, ...doc.data() });
  });

  // 🧠 Fata INKURU nyamukuru (nta Season/Episode)
  const groupedStories = {};

  posts.forEach((p) => {
    const baseTitle = p.head?.split("S")[0].trim();
    if (!groupedStories[baseTitle]) {
      groupedStories[baseTitle] = {
        title: baseTitle,
        totalViews: 0,
        episodes: [],
        categories: p.categories || [],
        imageUrl: p.imageUrl,
        author: p.author,
        createdAt: p.createdAt,
      };
    }

    groupedStories[baseTitle].episodes.push(p);
    groupedStories[baseTitle].totalViews += p.views || 0;
  });

  const stories = Object.values(groupedStories);

  // 🔥 Inkuru zikunzwe (views nyinshi)
  const popularStories = [...stories]
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 6);

  // 📢 Share suggestions (episodes zihariye)
  const shareSuggestions = posts
    .filter((p) =>
      p.categories?.some((c) =>
        ["Drama", "Love-Story", "Action"].includes(c)
      )
    )
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6);

  // 🎲 Random inkuru
  const randomStories = [...stories]
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);

  return {
    props: {
      stats: {
        totalStories: stories.length,
        totalEpisodes: posts.length,
      },
      popularStories,
      shareSuggestions,
      randomStories,
    },
  };
}

export default function ManagerPage({
  stats,
  popularStories,
  shareSuggestions,
  randomStories,
}) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📊 Manager Dashboard</h1>

      {/* INSIGHTS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Inkuru zose</h3>
          <p>{stats.totalStories}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Episodes zose</h3>
          <p>{stats.totalEpisodes}</p>
        </div>
      </div>

      {/* POPULAR */}
      <section>
        <h2 className={styles.sectionTitle}>🔥 Inkuru zikunzwe cyane</h2>
        <div className={styles.cardGrid}>
          {popularStories.map((s) => (
            <div key={s.title} className={styles.storyCard}>
              <img src={s.imageUrl} alt="" />
              <h3>{s.title}</h3>
              <p>Views: {s.totalViews}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SHARE */}
      <section>
        <h2 className={styles.sectionTitle}>📢 Inkuru zo gukorera Share</h2>
        <div className={styles.list}>
          {shareSuggestions.map((p) => (
            <div key={p.id} className={styles.listItem}>
              👉 {p.head}
            </div>
          ))}
        </div>
      </section>

      {/* RANDOM */}
      <section>
        <h2 className={styles.sectionTitle}>🎲 Inkuru za Random</h2>
        <div className={styles.list}>
          {randomStories.map((s) => (
            <div key={s.title} className={styles.listItem}>
              📘 {s.title}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
