"use client";

import { useEffect, useState, useRef } from "react";
import {
  db,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
} from "../firebase";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import styles from "../styles/meet.module.css";

export default function Meet() {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [text, setText] = useState("");

  const userName = typeof window !== "undefined" ? localStorage.getItem("userName") : "Guest";

  const messagesRef = collection(db, "meetMessages");
  const participantsRef = collection(db, "meetParticipants");

  const typingRef = collection(db, "typing");

  const typingTimeout = useRef(null);

  // JOIN MEETING
  useEffect(() => {
    if (!userName) return;

    setDoc(doc(participantsRef, userName), {
      name: userName,
      online: true,
      joinedAt: serverTimestamp(),
    });

    return () => {
      updateDoc(doc(participantsRef, userName), { online: false });
    };
  }, []);

  // REALTIME MESSAGES
  useEffect(() => {
    const unsub = onSnapshot(messagesRef, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setMessages(list.sort((a, b) => a.time?.seconds - b.time?.seconds));
    });

    return () => unsub();
  }, []);

  // REALTIME PARTICIPANTS
  useEffect(() => {
    const unsub = onSnapshot(participantsRef, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push(d.data()));
      setParticipants(list);
    });

    return () => unsub();
  }, []);

  // REALTIME TYPING INDICATOR
  useEffect(() => {
    const unsub = onSnapshot(typingRef, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push(d.id));
      setTypingUsers(list.filter((u) => u !== userName));
    });

    return () => unsub();
  }, []);

  // HANDLE TYPING
  const handleTyping = async (val) => {
    setText(val);

    await setDoc(doc(typingRef, userName), { typing: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      updateDoc(doc(typingRef, userName), { typing: false });
    }, 1500);
  };

  // SEND TEXT MESSAGE
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(messagesRef, {
      text,
      sender: userName,
      type: "text",
      time: serverTimestamp(),
    });

    setText("");
    await updateDoc(doc(typingRef, userName), { typing: false });
  };

  // SEND IMAGE AS BASE64
  const sendImageBase64 = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      await addDoc(messagesRef, {
        sender: userName,
        type: "image",
        image: reader.result,
        time: serverTimestamp(),
      });
    };

    reader.readAsDataURL(file);
  };

  // LEAVE MEETING
  const leaveMeeting = () => {
    if (userName !== "NewTalentsG") {
      updateDoc(doc(participantsRef, userName), { online: false });
      window.location.href = "/";
    }
  };

  return (
    <div className={styles.container}>

      {/* Participants */}
      <div className={styles.participants}>
        <h3>Participants Online</h3>
        {participants
          .filter((p) => p.online)
          .map((p, i) => (
            <p key={i} className={styles.user}>
              🟢 {p.name}
            </p>
          ))}
      </div>

      {/* Chat Area */}
      <div className={styles.chatArea}>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.sender === userName ? styles.myMsg : styles.otherMsg}
            >
              {m.type === "text" && <p>{m.text}</p>}
              {m.type === "image" && (
                <img src={m.image} className={styles.chatImage} />
              )}
              <small>{m.sender}</small>
            </div>
          ))}
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className={styles.typing}>
            {typingUsers.join(", ")} typing...
          </div>
        )}

        {/* Input Area */}
        <div className={styles.inputBox}>
          <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

          {showEmoji && (
            <div className={styles.emojiPicker}>
              <Picker
                data={data}
                onEmojiSelect={(e) => setText(text + e.native)}
              />
            </div>
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Write message..."
          />

          <input type="file" accept="image/*" onChange={sendImageBase64} />

          <button onClick={sendMessage}>Send</button>

          {userName !== "NewTalentsG" && (
            <button className={styles.leave} onClick={leaveMeeting}>
              Leave
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
