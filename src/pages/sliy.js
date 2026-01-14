import { useState, useEffect, useRef } from "react";
import styles from "./sliy.module.css";

export default function Sliy() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  // Speed mu SEGONDA (1s → 1800s = 30min)
  const [speed, setSpeed] = useState(10);

  const bodyRef = useRef(null);

  // Auto scroll (teleprompter)
  useEffect(() => {
    if (step !== 2) return;

    const interval = setInterval(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTop += 1;
      }
    }, speed * 1000); // guhindura seconds → milliseconds

    return () => clearInterval(interval);
  }, [speed, step]);

  return (
    <div className={styles.container}>
      {step === 1 && (
        <div className={styles.step}>
          <h2>Step 1: Andika Content</h2>

          <input
            className={styles.input}
            placeholder="Andika Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className={styles.textarea}
            placeholder="Andika inyandiko ndende (umurongo ku murongo)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <label className={styles.label}>
            Speed: {speed} second(s)
            {speed >= 60 && ` (${Math.floor(speed / 60)} min)`}
          </label>

          <input
            type="range"
            min="1"
            max="1800"
            step="1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />

          <button
            className={styles.nextBtn}
            disabled={!title || !text}
            onClick={() => setStep(2)}
          >
            Start Teleprompter
          </button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.screen}>
          <div className={styles.header}>{title}</div>

          <div className={styles.body} ref={bodyRef}>
            {text.split("\n").map((line, index) => (
              <p key={index} className={styles.line}>
                {line}
              </p>
            ))}
          </div>

          <div className={styles.controls}>
            <input
              type="range"
              min="1"
              max="1800"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span>
              {speed}s
              {speed >= 60 && ` (${Math.floor(speed / 60)}m)`}
            </span>
            <button onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
