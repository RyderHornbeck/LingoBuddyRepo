"use client";

import { useState, useRef } from "react";

const visemeFrames = {
  AEI: "/visemes/Viseme-AEI.png",
  BMP: "/visemes/Viseme-BMP.png",
  CDGKNSTXYZ: "/visemes/Viseme-CDGKNSTXYZ.png",
  ChSh: "/visemes/Viseme-ChJSh.png",
  Ee: "/visemes/Viseme-Ee.png",
  FV: "/visemes/Viseme-FV.png",
  L: "/visemes/Viseme-L.png",
  Neutral: "/visemes/Viseme-Neutral.png",
  O: "/visemes/Viseme-O.png",
  QWOO: "/visemes/Viseme-QWOo.png",
  R: "/visemes/Viseme-R.png",
  Smile: "/visemes/Viseme-Smile.png",
  Surprised: "/visemes/Viseme-Suprised.png",
  TH: "/visemes/Viseme-Th.png",
  U: "/visemes/Viseme-U.png",
};

const phonemeToViseme = {
  AE: "AEI", AH: "AEI", AY: "AEI", EH: "AEI", EY: "AEI",
  IY: "Ee",
  AO: "O", OW: "O",
  UW: "U", UH: "U",
  W: "QWOO", Q: "QWOO",
  R: "R", ER: "R",
  L: "L",
  M: "BMP", B: "BMP", P: "BMP",
  F: "FV", V: "FV",
  TH: "TH", DH: "TH",
  CH: "ChSh", JH: "ChSh", SH: "ChSh",
  C: "CDGKNSTXYZ", D: "CDGKNSTXYZ", G: "CDGKNSTXYZ", K: "CDGKNSTXYZ",
  N: "CDGKNSTXYZ", S: "CDGKNSTXYZ", T: "CDGKNSTXYZ", X: "CDGKNSTXYZ",
  Y: "CDGKNSTXYZ", Z: "CDGKNSTXYZ",
  "": "Neutral"
};

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentViseme, setCurrentViseme] = useState("Neutral");
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const intervalRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = handleRecordingStop;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordingStop = async () => {
    const blob = new Blob(recordedChunksRef.current, { type: "audio/mp3" });
    const formData = new FormData();
    formData.append("audio", blob, "input.mp3");
    formData.append("native_language", "English");
    formData.append("learning_language", "Spanish");

    const response = await fetch("http://localhost:8000/process-audio/", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    const audioBytes = Uint8Array.from(atob(result.audio_base64), (c) => c.charCodeAt(0));
    const audioBlob = new Blob([audioBytes], { type: "audio/mpeg" });
    const audioURL = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioURL);
    audioRef.current = audio;

    const visemeData = result.visemes;

    audio.addEventListener("play", () => {
      const startTime = performance.now();
      clearInterval(intervalRef.current); // reset any old interval

      intervalRef.current = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;

        const current = visemeData.find(
          (v) => elapsed >= v.start && elapsed <= v.end
        );

        if (current) {
          const phoneme = current.char.toUpperCase();
          const visemeKey = phonemeToViseme[phoneme] || "Neutral";
          setCurrentViseme(visemeKey);
        } else {
          setCurrentViseme("Neutral");
        }
      }, 50);
    });

    audio.addEventListener("ended", () => {
      clearInterval(intervalRef.current);
      setCurrentViseme("Neutral");
    });

    setCurrentViseme("Neutral");
    audio.play();
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>🌍 Welcome to GlobalLang</h1>
      <p>Start speaking and get feedback in your learning language!</p>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          marginTop: "2rem",
          padding: "1rem 2rem",
          fontSize: "1rem",
          background: isRecording ? "#e74c3c" : "#2ecc71",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>

      <div style={{ marginTop: "2rem" }}>
        <img
          src={visemeFrames[currentViseme] || visemeFrames["Neutral"]}
          alt={currentViseme}
          style={{ width: "150px", height: "150px" }}
        />
        <p>Current Viseme: {currentViseme}</p>
      </div>
    </div>
  );
}
