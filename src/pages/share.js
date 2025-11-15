import styles from "../styles/share.module.css";
import { collection, getDocs, query, where, doc, updateDoc, increment, setDoc } from "firebase/firestore";
import { db } from "../components/firebase";
import Cookies from "cookies";

export default function SharePage({ posts, username }) {

  const handleShare = async (postId) => {
    if (!username) return;

    const shareDocRef = doc(db, "shares", username);
    try {
      await updateDoc(shareDocRef, {
        [postId]: increment(1)
      });
    } catch (err) {
      await setDoc(shareDocRef, {
        [postId]: 1
      });
    }

    const shareLink = `https://www.newtalentsg.co.rw/post/${postId}`;
    navigator.clipboard.writeText(shareLink);
    alert("Link copied: " + shareLink);
  };

  return (
    <>
      <head>
        <title>Share your posts | {username}</title>
        <meta name="description" content={`Share your posts on New Talents. ${posts.length} posts available.`} />
      </head>
      <div className={styles.container}>
        <h1>Share your posts</h1>
        {posts.length === 0 && <p>No posts found for {username}</p>}
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.id} className={styles.item}>
              <span>{post.title}</span>
              <button onClick={() => handleShare(post.id)} className={styles.button}>
                Share
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// SSR
export async function getServerSideProps({ req, res }) {
  const cookies = new Cookies(req, res);
  const username = cookies.get("username") || "";

  let posts = [];

  if (username) {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("author", "==", username));
    const querySnapshot = await getDocs(q);

    posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  return {
    props: {
      posts,
      username,
    },
  };
}
