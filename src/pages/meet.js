import { useEffect, useState, useRef } from "react";
import styles from "../styles/meet.module.css";
import { FaPaperPlane, FaVideo, FaStop, FaSignOutAlt, FaImage } from "react-icons/fa";
import Cookies from "js-cookie";
import { db } from "@/components/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Meet() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [meeting, setMeeting] = useState({ active: false });
  const [showChat, setShowChat] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [privateUser, setPrivateUser] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const meetingDocRef = doc(db, "meetings", "current");

  // Check cookie for username
  useEffect(() => {
    const saved = Cookies.get("username");
    if (!saved) {
      router.push("/login"); // redirect to login
    } else {
      setUsername(saved);
    }
  }, []);

  // Meeting listener
  useEffect(() => {
    const unsub = onSnapshot(meetingDocRef, snap => {
      if (!snap.exists()) {
        setMeeting({ active: false });
        return;
      }
      const data = snap.data();
      setMeeting({
        active: data.active || false,
        hostUsername: data.hostUsername || null,
        startedAt: data.startedAt ? data.startedAt.toDate() : null
      });
    });
    return () => unsub();
  }, []);

  // Messages listener
  useEffect(() => {
    const msgsQuery = query(
      collection(db, "meetings", "current", "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(msgsQuery, snapshot => {
      const arr = [];
      snapshot.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setMessages(arr);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

      // update users list dynamically
      const allUsers = arr
        .filter(m => m.username && m.type === "user")
        .map(m => m.username);
      setUsers([...new Set(allUsers)]);
    });
    return () => unsub();
  }, []);

  // Typing indicator
  useEffect(() => {
    const typingRef = doc(db, "meetings", "current", "typing", username);
    let timeout;
    if (msg.trim()) {
      setDoc(typingRef, { username, typing: true }, { merge: true });
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        updateDoc(typingRef, { typing: false });
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [msg]);

  // Load typing users
  useEffect(() => {
    const typingColl = collection(db, "meetings", "current", "typing");
    const unsub = onSnapshot(typingColl, snap => {
      const typingArr = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.typing && data.username !== username) typingArr.push(data.username);
      });
      setTypingUsers(typingArr);
    });
    return () => unsub();
  }, []);

  // Join / Leave
  const joinMeeting = async () => {
    await addDoc(collection(meetingDocRef, "messages"), {
      username: "system",
      text: `${username} joined the meeting`,
      type: "system",
      createdAt: serverTimestamp()
    });
    setShowChat(true);
  };

  const leaveMeeting = async () => {
    await addDoc(collection(meetingDocRef, "messages"), {
      username: "system",
      text: `${username} left the meeting`,
      type: "system",
      createdAt: serverTimestamp()
    });
    setShowChat(false);
  };

  const endMeeting = async () => {
    // delete all messages
    const msgsSnap = await getDocs(collection(meetingDocRef, "messages"));
    msgsSnap.forEach(docSnap => deleteDoc(doc(db, "meetings", "current", "messages", docSnap.id)));
    // set meeting inactive
    await updateDoc(meetingDocRef, { active: false, endedAt: serverTimestamp() });
    setShowChat(false);
  };

  const sendMessage = async e => {
    e.preventDefault();
    if (!msg.trim() && !imageBase64) return;

    await addDoc(collection(meetingDocRef, "messages"), {
      username,
      text: msg.trim(),
      image: imageBase64 || null,
      type: privateUser ? "private" : "user",
      to: privateUser || null,
      createdAt: serverTimestamp()
    });
    setMsg("");
    setImageBase64(null);
    setImagePreview(null);
    setPrivateUser("");
  };

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Meeting Conner</h1>
        <div className={styles.userBox}>
          <label>Username:</label>
          <input value={username} disabled className={styles.usernameInput} />
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
            {username === meeting.hostUsername ? (
              <>
                {meeting.active ? (
                  <>
                    <button className={styles.endBtn} onClick={endMeeting}>
                      <FaStop /> End Meeting
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.launchBtn}
                    onClick={async () => {
                      await setDoc(meetingDocRef, {
                        active: true,
                        hostUsername: username,
                        startedAt: serverTimestamp()
                      }, { merge: true });
                      setShowChat(true);
                    }}
                  >
                    <FaVideo /> Launch Meeting
                  </button>
                )}
              </>
            ) : meeting.active ? (
              <>
                <button className={styles.joinBtn} onClick={joinMeeting}>
                  Join Meeting
                </button>
                <button className={styles.leaveBtn} onClick={leaveMeeting}>
                  <FaSignOutAlt /> Leave Meeting
                </button>
              </>
            ) : null}
          </div>
        </div>

        {showChat && meeting.active && (
          <section className={styles.chatSection}>
            <div className={styles.chatHeader}>
              <h2>Meeting Chat</h2>
              <div className={styles.privateContainer}>
                <label>Private:</label>
                <select
                  className={styles.privateSelect}
                  value={privateUser}
                  onChange={e => setPrivateUser(e.target.value)}
                >
                  <option value="">-- None --</option>
                  {users.filter(u => u !== username).map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.messages}>
              {messages.map(m => {
                if (m.type === "private" && m.to !== username && m.username !== username) return null;
                return (
                  <div
                    key={m.id}
                    className={`${styles.msg} ${
                      m.username === username ? styles.myMsg : ""
                    } ${m.type === "system" ? styles.systemMsg : ""}`}
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
                );
              })}
              <div ref={messagesEndRef} />
              {typingUsers.length > 0 && (
                <div className={styles.typing}>
                  {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
                </div>
              )}
            </div>

            <form className={styles.inputRow} onSubmit={sendMessage}>
              <input
                type="text"
                value={msg}
                placeholder="Type a message..."
                onChange={e => setMsg(e.target.value)}
              />
              <label className={styles.imageLabel}>
                <FaImage />
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
              {imagePreview && <img src={imagePreview} className={styles.preview} />}
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
