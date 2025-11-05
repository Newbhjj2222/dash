'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../components/firebase";
import { doc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie"; // ✅ For cookie
import styles from "../components/Login.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // Injira muri Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fata document 'data' ibitse users bose
      const docRef = doc(db, "userdate", "data");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        let found = false;

        // Shaka aho email yinjijwe ihuye n’iyo ibitse muri database
        for (const key in data) {
          const userData = data[key];
          if (userData.email === email) {
            const fName = userData.fName || "Unknown";

            // ✅ Save username in cookie instead of localStorage
            Cookies.set("username", fName, { expires: 7 }); // 7 days

            found = true;
            break;
          }
        }

        if (found) {
          setMessage("Winjiye neza!");
          router.push("/"); // Next.js route
        } else {
          setMessage("Email ntiyabonywe muri Firestore.");
        }
      } else {
        setMessage("Nta document 'data' ibonetse muri Firestore.");
      }

    } catch (error) {
      setMessage("Injira ntibishobotse: " + error.message);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h2>Sign in</h2>
        <form onSubmit={handleLogin}>
          {message && <div className={styles.messageDiv}>{message}</div>}
          <div className={styles.inputGroup}>
            <i className="fas fa-envelope"></i>
            <input
              type="email"
              placeholder="Email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <i className="fas fa-lock"></i>
            <input
              type="password"
              placeholder="Password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className={styles.btn} type="submit">Sign In</button>
        </form>

        <div className={styles.registerLink}>
          <p>
            Niba nta konti ya author ufite twandikire WhatsApp kuri{" "}
            <strong>+250722319367</strong> tugufashe.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;
