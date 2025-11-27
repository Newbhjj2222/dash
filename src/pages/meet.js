import { useEffect, useState, useRef } from "react";
import styles from "../styles/meet.module.css";
import { FaPaperPlane, FaVideo, FaStop, FaSignOutAlt, FaImage } from "react-icons/fa";
import Cookies from "js-cookie";
import { db } from "@/components/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  limit
} from "firebase/firestore";

export default function Meet({ initialUsername }) {
  const [username, setUsername] = useState(initialUsername || "");
  const [meeting, setMeeting] = useState({ active: false });
  const [showChat, setShowChat] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [privateUser, setPrivateUser] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const messagesEndRef = useRef(null);

  const meetingDocRef = doc(db, "meetings", "current");

  // Realtime meeting listener
  useEffect(() => {
    const unsub = onSnapshot(meetingDocRef, (snap) => {
      if (!snap.exists()) {
        setMeeting({ active: false });
        return;
      }
      const data = snap.data();
      setMeeting({
        active: data.active || false,
        hostUsername: data.hostUsername || null,
        startedAt: data.startedAt ? data.startedAt.toDate() : null,
      });
    });
    return () => unsub();
  }, []);

  // Realtime messages listener
  useEffect(() => {
    const msgsQuery = query(
      collection(db, "meetings", "current", "messages"),
      orderBy("createdAt", "asc"),
      limit(500)
    );

    const unsub = onSnapshot(msgsQuery, (snapshot) => {
      const arr = [];
      snapshot.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMessages(arr);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });

    return () => unsub();
  }, []);

  const saveUsername = () => {
    if (!username.trim()) return alert("Injiza username");
    Cookies.set("username", username.trim(), { expires: 7 });
  };

  const launchMeeting = async () => {
    await setDoc(meetingDocRef, {
      active: true,
      hostUsername: username,
      startedAt: serverTimestamp(),
    }, { merge: true });
    setShowChat(true);
  };

  const endMeeting = async () => {
    await updateDoc(meetingDocRef, {
      active: false,
      endedAt: serverTimestamp(),
    });
    setShowChat(false);
  };

  const leaveMeeting = async () => {
    await addDoc(collection(meetingDocRef, "messages"), {
      username: "system",
      text: `${username} left the meeting`,
      type: "system",
      createdAt: serverTimestamp(),
    });
    setShowChat(false);
  };

  const joinMeeting = async () => {
    if (!username) return alert("Banza ushyire username!");
    setShowChat(true);
    await addDoc(collection(meetingDocRef, "messages"), {
      username: "system",
      text: `${username} joined the meeting`,
      type: "system",
      createdAt: serverTimestamp(),
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msg.trim() && !imageBase64) return;
    await addDoc(collection(meetingDocRef, "messages"), {
      username,
      text: msg.trim() || "",
      image: imageBase64 || null,
      type: privateUser ? "private" : "user",
      to: privateUser || null,
      createdAt: serverTimestamp(),
    });
    setMsg("");
    setImageBase64(null);
    setPrivateUser("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Meeting Conner</h1>
        <div className={styles.userBox}>
          <label>Username:</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.usernameInput}
            placeholder="Set username"
          />
          <button onClick={saveUsername} className={styles.smallBtn}>
            Save
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.meetingCard}>
          <div className={styles.meetingInfo}>
            {meeting.active ? (
              <>
                <strong>Active Meeting</strong>
                <div>Host: {meeting.hostUsername}</div>
                <div>
                  Started: {meeting.startedAt ? meeting.startedAt.toLocaleString() : "recent"}
                </div>
              </>
            ) : (
              <strong className={styles.noMeeting}>No meeting today</strong>
            )}
          </div>

          <div className={styles.controls}>
            {username === "NewtalentsG" ? (
              meeting.active ? (
                <>
                  <button className={styles.endBtn} onClick={endMeeting}>
                    <FaStop /> End Meeting
                  </button>
                  <button className={styles.joinBtn} onClick={() => setShowChat(!showChat)}>
                    <FaVideo /> Open Chat
                  </button>
                </>
              ) : (
                <button className={styles.launchBtn} onClick={launchMeeting}>
                  <FaVideo /> Launch Meeting
                </button>
              )
            ) : meeting.active ? (
              <>
                <button className={styles.joinBtn} onClick={joinMeeting}>
                  Join Meeting
                </button>
                <button className={styles.leaveBtn} onClick={leaveMeeting}>
                  <FaSignOutAlt /> Leave Meeting
                </button>
              </>
            ) : (
              <div className={styles.noMeetingSmall}>No meeting to join</div>
            )}
          </div>
        </div>

        {/* CHAT UI */}
        {showChat && meeting.active && (
          <section className={styles.chatSection}>
            <div className={styles.chatHeader}>
              <h2>Meeting Chat</h2>
              <input
                placeholder="Private user (optional)"
                value={privateUser}
                onChange={(e) => setPrivateUser(e.target.value)}
                className={styles.privateInput}
              />
            </div>

            <div className={styles.messages}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.msg} ${
                    m.username === username ? styles.myMsg : ""
                  } ${m.type === "system" ? styles.systemMsg : ""} ${
                    m.type === "private" && m.to !== username ? styles.hiddenMsg : ""
                  }`}
                >
                  <div className={styles.msgMeta}>
                    <strong>{m.username}</strong>
                    {m.to && <span className={styles.toUser}> → {m.to}</span>}
                  </div>
                  <div className={styles.msgBody}>
                    {m.text}
                    {m.image && <img src={m.image} className={styles.msgImage} />}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputRow} onSubmit={sendMessage}>
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Type a message..."
              />
              <label className={styles.imageLabel}>
                <FaImage />
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
              <button className={styles.sendBtn}>
                <FaPaperPlane />
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

// SSR without firebase-admin
import { parse } from "cookie";
export async function getServerSideProps(context) {
  const cookies = context.req.headers.cookie ? parse(context.req.headers.cookie) : {};
  const username = cookies.username || null;
  return { props: { initialUsername: username } };
}
