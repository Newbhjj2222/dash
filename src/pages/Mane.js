import { collection, getDocs } from "firebase/firestore";
import { db } from "@/components/firebase";

export async function getServerSideProps() {
  const snap = await getDocs(collection(db, "posts"));

  let posts = [];
  snap.forEach((doc) => {
    posts.push({ id: doc.id, ...doc.data() });
  });

  // 🚫 Kurandura inkuru za Sex 🔞 burundu
  const cleanPosts = posts.filter(
    (p) => !p.categories?.includes("Sex 🔞Story")
  );

  // ❌ Inkuru zidakurikiza amategeko (uretse sex)
  const violations = cleanPosts.filter(
    (p) =>
      p.monetizationStatus === "blocked" ||
      (p.story &&
        p.story.replace(/<[^>]*>/g, "").length < 300)
  );

  // 📢 Inkuru zo gukorera share cyane
  const shareBoost = cleanPosts
    .filter((p) =>
      p.categories?.some((c) =>
        ["Drama", "Love-Story", "Action"].includes(c)
      )
    )
    .slice(0, 6);

  // 🎲 Random posts zo gukorera share
  const randomPosts = [...cleanPosts]
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);

  // 📊 Insights
  const authors = new Set();
  let recentPosts = 0;
  const now = new Date();

  cleanPosts.forEach((p) => {
    authors.add(p.author);
    const created = new Date(p.createdAt);
    if ((now - created) / (1000 * 60 * 60 * 24) <= 7) {
      recentPosts++;
    }
  });

  return {
    props: {
      insights: {
        totalPosts: cleanPosts.length,
        authors: authors.size,
        recentPosts,
      },
      violations,
      shareBoost,
      randomPosts,
    },
  };
}

export default function ManagerPage({
  insights,
  violations,
  shareBoost,
  randomPosts,
}) {
  return (
    <div style={{ padding: 24 }}>
      <h1>📊 Manager Dashboard – SSR</h1>

      <section>
        <h2>📈 Insights rusange</h2>
        <p>Inkuru zose (nta 🔞): {insights.totalPosts}</p>
        <p>Abanditsi: {insights.authors}</p>
        <p>Inkuru nshya (7 days): {insights.recentPosts}</p>
      </section>

      <section>
        <h2>❌ Inkuru zidakurikiza amategeko</h2>
        {violations.length === 0 ? (
          <p>Nta kibazo gihari</p>
        ) : (
          violations.map((p) => (
            <div key={p.id}>
              ⚠️ <strong>{p.head}</strong> — {p.author}
            </div>
          ))
        )}
      </section>

      <section>
        <h2>📢 Inkuru zo gukorera share cyane</h2>
        {shareBoost.map((p) => (
          <div key={p.id}>🔥 {p.head}</div>
        ))}
      </section>

      <section>
        <h2>🎲 Random posts zo gukorera share</h2>
        {randomPosts.map((p) => (
          <div key={p.id}>👉 {p.head}</div>
        ))}
      </section>
    </div>
  );
}
