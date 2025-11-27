// pages/meet.js
import { useEffect, useState, useRef } from "react";
import styles from "../styles/meet.module.css";
import { FaPaperPlane, FaVideo, FaStop } from "react-icons/fa";
import Cookies from "js-cookie";
import { db } from "@/components/firebase"; // uko wavuze ko iriho
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";

export default function Meet({ initialMeeting, initialUsername }) {
  // initialMeeting from SSR: { active: boolean, hostUsername, startedAt }
  const [meeting, setMeeting] = useState(initialMeeting);
  const [username, setUsername] = useState(initialUsername || "");
  const [showChat, setShowChat] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [joining, setJoining] = useState(false);
  const meetingDocRef = doc(db, "meetings", "current");

  useEffect(() => {
    // subscribe to meeting doc realtime
    const unsubMeeting = onSnapshot(meetingDocRef, (snap) => {
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

    // subscribe to messages realtime
    const msgsQuery = query(
      collection(db, "meetings", "current", "messages"),
      orderBy("createdAt", "asc"),
      limit(500)
    );
    const unsubMsgs = onSnapshot(msgsQuery, (snapshot) => {
      const arr = [];
      snapshot.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMessages(arr);
      // auto scroll later
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => {
      unsubMeeting();
      unsubMsgs();
    };
  }, []);

  useEffect(() => {
    // if username not set, offer input; if set to NewtalentsG and meeting active, allow controls
    if (!username) {
      // leave it — user will set via form below
    } else {
      Cookies.set("username", username, { expires: 7 });
    }
  }, [username]);

  const launchMeeting = async () => {
    if (!username) return alert("Set a username first.");
    // set meeting doc active true
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

  const joinMeeting = async () => {
    if (!username) return alert("Set a username first.");
    setJoining(true);
    setShowChat(true);
    // optionally log join system message
    await addDoc(collection(meetingDocRef, "messages"), {
      text: `${username} joined the meeting.`,
      username: "system",
      createdAt: serverTimestamp(),
      type: "system",
    });
    setJoining(false);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!msg.trim()) return;
    await addDoc(collection(meetingDocRef, "messages"), {
      text: msg.trim(),
      username,
      createdAt: serverTimestamp(),
      type: "user",
    });
    setMsg("");
  };

  const handleSetUsername = (e) => {
    e.preventDefault();
    if (!username.trim()) return alert("Enter a username");
    Cookies.set("username", username.trim(), { expires: 7 });
    // refresh? we keep it client-side only
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
            placeholder="username (from cookie)"
            className={styles.usernameInput}
          />
          <button onClick={handleSetUsername} className={styles.smallBtn}>Save</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.meetingCard}>
          <div className={styles.meetingInfo}>
            {meeting?.active ? (
              <>
                <div>
                  <strong>Active meeting</strong>
                </div>
                <div>Host: {meeting.hostUsername}</div>
                <div>
                  Started:{" "}
                  {meeting.startedAt ? new Date(meeting.startedAt).toLocaleString() : "recent"}
                </div>
              </>
            ) : (
              <div className={styles.noMeeting}>There is no meeting today</div>
            )}
          </div>

          <div className={styles.controls}>
            {username === "NewtalentsG" ? (
              meeting?.active ? (
                <>
                  <button className={styles.endBtn} onClick={endMeeting}>
                    <FaStop /> End Meeting
                  </button>
                  <button
                    className={styles.joinBtn}
                    onClick={() => setShowChat((s) => !s)}
                    title="Open chat"
                  >
                    <FaVideo /> Open Chat
                  </button>
                </>
              ) : (
                <button className={styles.launchBtn} onClick={launchMeeting}>
                  <FaVideo /> Launch Meeting
                </button>
              )
            ) : meeting?.active ? (
              <button className={styles.joinBtn} onClick={joinMeeting} disabled={joining}>
                {joining ? "Joining..." : "Join Meeting"}
              </button>
            ) : (
              <div className={styles.noMeetingSmall}>No meeting to join</div>
            )}
          </div>
        </div>

        {/* Chat area */}
        {showChat && meeting?.active && (
          <section className={styles.chatSection}>
            <div className={styles.chatHeader}>
              <h2>Meeting Chat</h2>
              <div>Host: {meeting.hostUsername}</div>
            </div>
            <div className={styles.messages}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.msg} ${m.username === username ? styles.myMsg : ""} ${
                    m.type === "system" ? styles.systemMsg : ""
                  }`}
                >
                  <div className={styles.msgMeta}>
                    <strong>{m.username}</strong>
                    <span className={styles.msgTime}>
                      {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString() : ""}
                    </span>
                  </div>
                  <div className={styles.msgBody}>{m.text}</div>
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
              <button type="submit" className={styles.sendBtn}>
                <FaPaperPlane />
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

// SERVER SIDE: read username cookie and initial meeting state
import { parse } from "cookie";
import { adminDb } from "../lib/firebaseAdmin";

export async function getServerSideProps(context) {
  const cookies = context.req.headers.cookie ? parse(context.req.headers.cookie) : {};
  const username = cookies.username || null;

  // read meeting doc from Firestore (server-side)
  try {
    const docRef = adminDb.collection("meetings").doc("current");
    const snap = await docRef.get();
    if (!snap.exists) {
      return {
        props: {
          initialMeeting: { active: false },
          initialUsername: username,
        },
      };
    }
    const data = snap.data();
    // Convert Firestore Timestamp to ISO for serializable props
    const startedAt = data.startedAt ? data.startedAt.toDate().toISOString() : null;
    return {
      props: {
        initialMeeting: {
          active: !!data.active,
          hostUsername: data.hostUsername || null,
          startedAt,
        },
        initialUsername: username,
      },
    };
  } catch (err) {
    console.error("Error fetching meeting on server:", err.message || err);
    return {
      props: {
        initialMeeting: { active: false },
        initialUsername: username,
      },
    };
  }
}
