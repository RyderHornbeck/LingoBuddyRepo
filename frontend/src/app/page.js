"use client";
import { useState, useRef, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { FaMicrophone } from "react-icons/fa";
import { FaStop } from "react-icons/fa";
import { CiRepeat } from "react-icons/ci";
import NavBar from "./NavBar";
import SideBar from "./SideBar";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import "./globals.css";
import { useRouter } from "next/navigation";

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
    welcome: "Welcome to Lingo Buddy",
    startSpeaking: "Start speaking and get feedback in your learning language!",
    nativeLangLabel: "Native Language",
    learningLangLabel: "Learning Language",
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    currentViseme: "Current Viseme:",
  },
  es: {
    welcome: "Bienvenido a Lingo Buddy",
    startSpeaking:
      "¡Comienza a hablar y recibe retroalimentación en tu idioma de aprendizaje!",
    nativeLangLabel: "Idioma Nativo",
    learningLangLabel: "Idioma de Aprendizaje",
    startRecording: "Iniciar Grabación",
    stopRecording: "Detener Grabación",
    currentViseme: "Visema Actual:",
  },
  fr: {
    welcome: "Bienvenue à Lingo Buddy",
    startSpeaking:
      "Commencez à parler et obtenez des retours dans votre langue d'apprentissage !",
    nativeLangLabel: "Langue Maternelle",
    learningLangLabel: "Langue Apprise",
    startRecording: "Commencer l'enregistrement",
    stopRecording: "Arrêter l'enregistrement",
    currentViseme: "Visème Actuel :",
  },
  de: {
    welcome: "Willkommen bei Lingo Buddy",
    startSpeaking:
      "Beginnen Sie zu sprechen und erhalten Sie Feedback in Ihrer Lernsprache!",
    nativeLangLabel: "Muttersprache",
    learningLangLabel: "Lernsprache",
    startRecording: "Aufnahme starten",
    stopRecording: "Aufnahme stoppen",
    currentViseme: "Aktueller Viseme:",
  },
  ja: {
    welcome: "Lingo Buddy へようこそ",
    startSpeaking: "話し始めて、学習言語でフィードバックを受け取りましょう！",
    nativeLangLabel: "母国語",
    learningLangLabel: "学習言語",
    startRecording: "録音を開始",
    stopRecording: "録音を停止",
    currentViseme: "現在のビセーム：",
  },
  zh: {
    welcome: "欢迎来到 Lingo Buddy",
    startSpeaking: "开始说话，并用你正在学习的语言获得反馈！",
    nativeLangLabel: "母语",
    learningLangLabel: "学习语言",
    startRecording: "开始录音",
    stopRecording: "停止录音",
    currentViseme: "当前的口型：",
  },
};

// Helper to convert nativeLang string to language code for translations
const langNameToCode = {
  English: "en",
  Spanish: "es",
  French: "fr",
  Dutch: "de",
  Japanese: "ja",
  Mandarin: "zh"
};

export default function Home() {

  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [visemeData, setvisemeData] = useState([]);
  const [nativeflagSrc, setNativeSrc] = useState("united-kingdom.png");
  const [learnflagSrc, setLearnSrc] = useState("spain.png");
  const [nativeLang, setNativeLang] = useState("English");
  const [learningLang, setLearningLang] = useState("Spanish");
  const [tutorName, setTutorName] = useState("Javier");
  const [isRecording, setIsRecording] = useState(false);
  const [currentViseme, setCurrentViseme] = useState("Neutral");
  const [animationIndexLearned, setAnimationIndexL] = useState(1);
  const [conversations, setConversations] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [convoNumber, setConvoNumber] = useState(0);
  const [editConvo, setEditConvo] = useState(false);
  const [convoTitles, setConvoTitles] = useState([]);
  const [audioURL, setAudioURL] = useState("");
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const intervalRef = useRef(null);
  const animations = [
    "EnglishC.png",
    "SpanishC.png",
    "FrenchC.png",
    "DutchC.png",
    "JapaneseC.png",
    "MandarinC.png",
  ];

  // Determine current translation object from nativeLang
  const nativeCode = langNameToCode[nativeLang] || "en";
  const t = translations[nativeCode];
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);
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
    formData.append("MessageIndex", convoNumber);

    const response = await fetch("http://localhost:8000/process-audio/", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    setConversations((prev) => {
    const updatedConversations = [...prev];


    const currentConvo = updatedConversations[convoNumber];
    const updatedConvo = {
      ...currentConvo, 
      messages: [     
        ...currentConvo.messages,
        { you: result.transcript, tutor: result.ai_response }
      ]
    };
    updatedConversations[convoNumber] = updatedConvo;

    // 5. Return the fully updated array of conversations
    return updatedConversations;
  });
    const audioBytes = Uint8Array.from(atob(result.audio_base64), (c) =>
      c.charCodeAt(0)
    );
    const audioBlob = new Blob([audioBytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(audioBlob);
    setAudioURL(url);
    const audio = new Audio(url);
    audioRef.current = audio;

    setvisemeData(result.visemes);

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
  const replayAudio = () => {
  if (!audioURL) return;
  const audio = new Audio(audioURL);
  audioRef.current = audio;

  audio.addEventListener("ended", () => {
    clearInterval(intervalRef.current);
    setCurrentViseme("Neutral");
  });

  audio.addEventListener("play", () => {
    const startTime = performance.now();
    clearInterval(intervalRef.current);

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

  audio.play();
};
useEffect(() => {
  return () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
  };
}, [audioURL]);
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
        setNativeLang("French");
        break;
      case "de":
        setNativeSrc("netherlands.png");
        setNativeLang("Dutch");
        break;
      case "ja":
        setNativeSrc("japan.png");
        setNativeLang("Japanese");
        break;
      case "zh":
        setNativeSrc("mandarin.png");
        setNativeLang("Mandarin");
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
        setTutorName("John");
        break;
      case "es":
        setLearnSrc("spain.png");
        setLearningLang("Spanish");
        setAnimationIndexL(1);
        setTutorName("Javier");
        break;
      case "fr":
        setLearnSrc("france.png");
        setLearningLang("French");
        setAnimationIndexL(2);
        setTutorName("Camille");
        break;
      case "de":
        setLearnSrc("netherlands.png");
        setLearningLang("Dutch");
        setAnimationIndexL(3);
        setTutorName("Daan");
        break;
      case "ja":
        setLearnSrc("japan.png");
        setLearningLang("Japanese");
        setAnimationIndexL(4);
        setTutorName("Haruka");
        break;
      case "zh":
        setLearnSrc("mandarin.png");
        setLearningLang("Mandarin");
        setAnimationIndexL(5);
        setTutorName("Li Wei");
        break;
    }
  };
const handleSubmit = (e) => {
  const newConvo = {
    messages: [],
    nativeLang: nativeLang,
    learningLang: learningLang,
    tutorName: tutorName,
    nativeflagSrc: nativeflagSrc,
    learnflagSrc: learnflagSrc,
    animationIndexLearned: animationIndexLearned
  }
  const newIndex = conversations.length;
 setConversations((prev) => {
  const newConversations = [...prev, newConvo];
  
  return newConversations;
});
setConvoNumber(newIndex);
setShowTitle(false);
setConvoTitles((prev)  => {
  return [...prev,"Chat " + (prev.length+1) ];
})
};
  const newChat = (e) => {
    e.preventDefault();
    setShowTitle(true);
  setNativeSrc("united-kingdom.png");
  setLearnSrc("spain.png");
 setNativeLang("English");
setLearningLang("Spanish");
  }
  const selectChat = (index) => {
    setConvoNumber(index);
    const selectedConvo = conversations[index];
     setNativeLang(selectedConvo.nativeLang);
  setLearningLang(selectedConvo.learningLang);
  setTutorName(selectedConvo.tutorName);
  setNativeSrc(selectedConvo.nativeflagSrc);
  setLearnSrc(selectedConvo.learnflagSrc);
   setShowTitle(false);
   setAnimationIndexL(selectedConvo.animationIndexLearned);
  }
  useEffect(() => {
    const token = localStorage.getItem("loggedInUser");
    if (!token) {
      router.replace("/LogSig");
    } else {
      setIsCheckingAuth(false);  // Done checking, show the main page
    }
  }, []);

  if (isCheckingAuth) {
    return <div>Loading...</div>;  // Or spinner
  }
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
    >
      <NavBar nativeflagSrc = {nativeflagSrc} learnflagSrc = {learnflagSrc}/>

      <main className="flex h-[100vh] transition-all duration-300">
        {/* Left Panel - Chat Interface */}

        {/* Sidebar */}
        <SideBar
  isOpen={isOpen}
  setIsOpen={setIsOpen}
  newChat={newChat}
  convoTitles={convoTitles}
  conversations={conversations}
  convoNumber={convoNumber}
  selectChat={selectChat}
  editConvo={editConvo}
  setEditConvo={setEditConvo}
  setConvoTitles={setConvoTitles}
/>
  <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white hover:bg-slate-200 border border-black rounded shadow mx-2 my-4 w-fit h-fit "
      >
        {isOpen ? (
          <GoSidebarCollapse size={24} />
        ) : (
          <GoSidebarExpand size={24} />
        )}
      </button>

        <div className="w-1/2 flex flex-col  items-center border-r border-black">
          {/* Header Card */}
         { showTitle && <div className="bg-white rounded-2xl p-6 border-2 border-slate-900 m-6 max-w-lg flex flex-col text-center">
            <h1 className="font-bold text-2xl lg:text-4xl flex items-center justify-center gap-5 mb-3">
              <img
                src={`/${nativeflagSrc}`}
                className="h-12"
                alt="Native flag"
              />
              {t.welcome}
              <img
                src={`/${learnflagSrc}`}
                className="h-12"
                alt="Learning flag"
              />
            </h1>
            <p className="text-lg lg:text-xl text-center mb-4">
              {t.startSpeaking}
            </p>

            {/* Language Selection */}
            <div className="text-center">
              <div className="flex justify-center gap-8 mb-3 text-lg">
                <span>{t.nativeLangLabel}</span>
                <span>{t.learningLangLabel}</span>
              </div>
              <form className="flex gap-4 justify-center"  onSubmit={handleSubmit}>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-base"
                  defaultValue="en"
                  onChange={changeNative}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Mandarin</option>
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-base"
                  defaultValue="es"
                  onChange={changeLearn}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Mandarin</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Submit
                </button>
              </form>
            </div>
          </div> }

          {/* Chat Area */}
         {!showTitle && <div className="flex-1 min-w-4/5 max-w-2xl mt-6 pb-6">
            <div className="bg-gray-50 rounded-xl border border-gray-300 h-156 overflow-y-auto p-4 space-y-4">
              {conversations[convoNumber].messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  Start a conversation by recording your voice!
                </div>
              ) : (
                conversations[convoNumber].messages.map((pair, index) => (
                  <div key={index} className="space-y-3">
                    {/* User Message Bubble */}
                    <div className="flex justify-start">
                      <div className="max-w-xs lg:max-w-md">
                        <div className="bg-blue-500 text-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                          <p className="text-sm font-medium text-blue-100 mb-1">
                            You
                          </p>
                          <p className="text-base">{pair.you}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tutor Message Bubble */}
                    <div className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md">
                        <div className="bg-green-500 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
                          <p className="text-sm font-medium text-green-100 mb-1 text-right">
                            {tutorName}
                          </p>
                          <p className="text-base">{pair.tutor}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef}></div>
            </div>
          </div> }
        </div>

        {/* Right Panel - Avatar */}
        <div className="w-1/2 flex flex-col items-center justify-center">
          <div className="relative w-80 h-80 lg:w-96 lg:h-96 mb-8">
            <img
              src={`${animations[animationIndexLearned]}`}
              className="absolute top-0 left-0 w-full h-full object-contain z-0"
              alt="Tutor avatar"
            />
            <img
              src={visemeFrames[currentViseme] || visemeFrames["Neutral"]}
              alt={currentViseme}
              className="absolute z-10 w-20 lg:w-32 top-4/15 left-1/2 transform -translate-x-1/2"
            />
          </div>

          {/* Recording Button */}
         {!showTitle && <div className="relative w-full h-24"> <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"> <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`border-2 border-black rounded-full p-6 transition-colors duration-200 ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-white hover:bg-gray-100 text-black"
            }`}
          >
            {isRecording ? (
              <FaStop className="w-8 h-8" />
            ) : (
              <FaMicrophone className="w-8 h-8" />
            )}
          </button> </div> <div className="absolute right-[20%] top-1/2 transform -translate-y-1/2 ">{audioURL && (<button onClick={replayAudio}> <CiRepeat className="w-12 h-12 rounded-2xl border-2 border-black"  /></button>)} </div></div> }
        </div>
        
      </main>
    </div>
  );
}
