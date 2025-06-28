"use client";

import { useState, useRef } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  AE: "AEI",
  AH: "AEI",
  AY: "AEI",
  EH: "AEI",
  EY: "AEI",
  IY: "Ee",
  AO: "O",
  OW: "O",
  UW: "U",
  UH: "U",
  W: "QWOO",
  Q: "QWOO",
  R: "R",
  ER: "R",
  L: "L",
  M: "BMP",
  B: "BMP",
  P: "BMP",
  F: "FV",
  V: "FV",
  TH: "TH",
  DH: "TH",
  CH: "ChSh",
  JH: "ChSh",
  SH: "ChSh",
  C: "CDGKNSTXYZ",
  D: "CDGKNSTXYZ",
  G: "CDGKNSTXYZ",
  K: "CDGKNSTXYZ",
  N: "CDGKNSTXYZ",
  S: "CDGKNSTXYZ",
  T: "CDGKNSTXYZ",
  X: "CDGKNSTXYZ",
  Y: "CDGKNSTXYZ",
  Z: "CDGKNSTXYZ",
  "": "Neutral",
};

// Translation object keyed by language code
const translations = {
  en: {
    welcome: "Welcome to GlobalLang",
    startSpeaking: "Start speaking and get feedback in your learning language!",
    nativeLangLabel: "Native Language",
    learningLangLabel: "Learning Language",
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    currentViseme: "Current Viseme:",
  },
  es: {
    welcome: "Bienvenido a GlobalLang",
    startSpeaking: "¡Comienza a hablar y recibe retroalimentación en tu idioma de aprendizaje!",
    nativeLangLabel: "Idioma Nativo",
    learningLangLabel: "Idioma de Aprendizaje",
    startRecording: "Iniciar Grabación",
    stopRecording: "Detener Grabación",
    currentViseme: "Visema Actual:",
  },
  fr: {
    welcome: "Bienvenue à GlobalLang",
    startSpeaking: "Commencez à parler et obtenez des retours dans votre langue d'apprentissage !",
    nativeLangLabel: "Langue Maternelle",
    learningLangLabel: "Langue Apprise",
    startRecording: "Commencer l'enregistrement",
    stopRecording: "Arrêter l'enregistrement",
    currentViseme: "Visème Actuel :",
  },
  de: {
    welcome: "Willkommen bei GlobalLang",
    startSpeaking: "Beginnen Sie zu sprechen und erhalten Sie Feedback in Ihrer Lernsprache!",
    nativeLangLabel: "Muttersprache",
    learningLangLabel: "Lernsprache",
    startRecording: "Aufnahme starten",
    stopRecording: "Aufnahme stoppen",
    currentViseme: "Aktueller Viseme:",
  },
};

// Helper to convert nativeLang string to language code for translations
const langNameToCode = {
  English: "en",
  Spanish: "es",
  France: "fr",
  Dutch: "de",
};

export default function Home() {
  const [nativeflagSrc, setNativeSrc] = useState("united-kingdom.png");
  const [learnflagSrc, setLearnSrc] = useState("spain.png");
  const [nativeLang, setNativeLang] = useState("English");
  const [learningLang, setLearningLang] = useState("Spanish");
  const [isRecording, setIsRecording] = useState(false);
  const [currentViseme, setCurrentViseme] = useState("Neutral");
  const [animationIndexLearned, setAnimationIndexL] = useState(1);
  const [transcript, setTranscript] = useState("");
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const intervalRef = useRef(null);
  const animations = [
    "EnglishC.png",
    "SpanishC.png",
    "FrenchC.png",
    "DutchC.png",
  ];

  // Determine current translation object from nativeLang
  const nativeCode = langNameToCode[nativeLang] || "en";
  const t = translations[nativeCode];

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
    formData.append("native_language", nativeLang);
    formData.append("learning_language", learningLang);

    const response = await fetch("http://localhost:8000/process-audio/", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setTranscript(result.ai_response);

    const audioBytes = Uint8Array.from(atob(result.audio_base64), (c) =>
      c.charCodeAt(0)
    );
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
  const changeNative = (e) => {
    const value = e.target.value;
    switch (value) {
      case "en":
        setNativeSrc("united-kingdom.png");
        setNativeLang("English");
        break;
      case "es":
        setNativeSrc("spain.png");
        setNativeLang("Spanish");
        break;
      case "fr":
        setNativeSrc("france.png");
        setNativeLang("France");
        break;
      case "de":
        setNativeSrc("netherlands.png");
        setNativeLang("Dutch");
        break;
    }
  };
  const changeLearn = (e) => {
    const value = e.target.value;
    switch (value) {
      case "en":
        setLearnSrc("united-kingdom.png");
        setLearningLang("English");
        setAnimationIndexL(0);
        break;
      case "es":
        setLearnSrc("spain.png");
        setLearningLang("Spanish");
        setAnimationIndexL(1);
        break;
      case "fr":
        setLearnSrc("france.png");
        setLearningLang("France");
        setAnimationIndexL(2);
        break;
      case "de":
        setLearnSrc("netherlands.png");
        setLearningLang("Dutch");
        setAnimationIndexL(3);
        break;
    }
  };
  return (
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      {/* 🧭 Top Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          backgroundColor: "#f5f5f5",
        }}
        className="relative border-b-2 border-black z-20"
      >
        <span
          style={{
            fontWeight: "bold",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            columnGap: "10px",
          }}
        >
          <img
            src={`/${nativeflagSrc}`}
            style={{ height: "50px", padding: "5px" }}
          />
          GlobalLang
          <img
            src={`/${learnflagSrc}`}
            style={{ height: "50px", padding: "5px" }}
          />
        </span>
      </nav>
      <main className="h-screen  w-full">
        <div className="flex h-full w-full absolute top-0 left-0 z-0">
          <div className={` w-4/9 h-full relative flex items-center`}>
            <div className="relative w-[500px] h-[500px] m-auto">
              <img
                src={`${animations[animationIndexLearned]}`}
                className="absolute top-0 left-0 w-full h-full object-contain z-0"
                alt="Face"
              />
              <img
                src={visemeFrames[currentViseme] || visemeFrames["Neutral"]}
                alt={currentViseme}
                className="absolute z-10"
                style={{
                  width: "150px",
                  top: "30%",
                  left: "48%",
                  transform: "translateX(-50%)",
                }}
              />
            </div>
          </div>
          <div className="bg-slate-200 h-full w-1/9 border-slate-900 border-x-2"></div>
          <div className="h-full w-4/9 flex justify-center items-center">
            <div className="w-1/2 h-1/2 border-slate-900 border-2 rounded-2xl">
              <p className="p-5 text-xl">{transcript}</p>
            </div>
          </div>
        </div>
        <div className=" relative z-10 flex justify-center h-full w-full">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <div className="bg-white rounded-2xl p-4 border-2 border-slate-900">
              <h1
                style={{
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  columnGap: "20px",
                }}
                className="xl:text-4xl md:text-xl"
              >
                <img
                  src={`/${nativeflagSrc}`}
                  style={{ height: "50px", padding: "5px" }}
                />{" "}
                {t.welcome}
                <img
                  src={`/${learnflagSrc}`}
                  style={{ height: "50px", padding: "5px" }}
                />
              </h1>
              <p className="xl:text-xl md:text-md">{t.startSpeaking}</p>
              <div
                style={{ display: "flex", justifyContent: "center" }}
                className="gap-x-4 md:text-md xl:text-xl"
              >
                <p>{t.nativeLangLabel}</p>
                <p>{t.learningLangLabel}</p>
              </div>
              <div className="flex gap-4 justify-center">
                <select
                  className="xl:text-md md:text-base"
                  style={{
                    padding: "0.4rem 0.6rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                  defaultValue="en"
                  onChange={changeNative}
                >
                  <option value="en">English </option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
                <select
                  style={{
                    padding: "0.4rem 0.6rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "1rem",
                  }}
                  defaultValue="es"
                  onChange={changeLearn}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
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
                {isRecording ? t.stopRecording : t.startRecording}
              </button>
            </div>
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "center",
              }}
            ></div>
            <p>{t.currentViseme} {currentViseme}</p>
          </div>
        </div>
      </main>
    </body>
  );
}
