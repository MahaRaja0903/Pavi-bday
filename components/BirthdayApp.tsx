"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import dynamic from "next/dynamic";
import { Gift, Cake, Flower, Popsicle, Check, X } from "lucide-react";

// Dynamically import FlowerWand to avoid SSR issues with its canvas/camera
const FlowerWand = dynamic(() => import("@/components/FlowerWand"), { ssr: false });

const VALID_NAMES = ["pavithra", "pavithra m", "pavithra m ", "maharaja"];

const QUOTES = [
  "Calories don't count today. That's tomorrow's problem.",
  "Growing older is mandatory. Growing up is optional.",
  "Today's mission: Eat cake and blame the candles.",
  "You officially survived another year."
];

const CHOCO_MESSAGES = [
  "Finding the perfect chocolate...",
  "Adding extra sweetness...",
  "Packing happiness...",
  "Almost ready...",
  "Your surprise is on the way ❤️"
];

export default function BirthdayApp() {
  const [screen, setScreen] = useState<"welcome" | "birthday" | "choco" | "cake" | "gift" | "flower">("welcome");
  
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  const [quote, setQuote] = useState("");
  const [selectedReward, setSelectedReward] = useState<number | null>(null);
  const [confirmReward, setConfirmReward] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState(300);
  const [chocoMsgIndex, setChocoMsgIndex] = useState(0);

  const [candlesBlown, setCandlesBlown] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setNameError(false);
    setNameSuccess(false);
  };

  const validateName = () => {
    const normalized = name.trim().toLowerCase();
    if (VALID_NAMES.includes(normalized)) {
      setNameSuccess(true);
      setNameError(false);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } else {
      setNameError(true);
      setNameSuccess(false);
    }
  };

  const handleContinue = () => {
    setScreen("birthday");
    setTimeout(() => {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }, 500);
  };

  const REWARDS = [
    { id: 1, title: "Choco Bar", icon: <Popsicle size={40} className="icon-choco" />, screen: "choco", cssClass: "reward-choco" },
    { id: 2, title: "Cake", icon: <Cake size={40} className="icon-cake" />, screen: "cake", cssClass: "reward-cake" },
    { id: 3, title: "Gift", icon: <Gift size={40} className="icon-gift" />, screen: "gift", cssClass: "reward-gift" },
    { id: 4, title: "Flowers", icon: <Flower size={40} className="icon-flower" />, screen: "flower", cssClass: "reward-flower" }
  ];

  const handleRewardClick = (id: number) => {
    if (confirmReward === null) {
      setSelectedReward(id);
    }
  };

  const confirmSelection = (id: number) => {
    setConfirmReward(id);
    const targetScreen = REWARDS.find((r) => r.id === id)?.screen as any;
    setTimeout(() => {
      setScreen(targetScreen);
    }, 500);
  };

  useEffect(() => {
    if (screen === "choco" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    if (screen === "choco" && timeLeft === 0) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [screen, timeLeft]);

  useEffect(() => {
    if (screen === "choco") {
      const interval = setInterval(() => {
        setChocoMsgIndex((prev) => Math.min(prev + 1, CHOCO_MESSAGES.length - 1));
      }, Math.max(1000, 300000 / CHOCO_MESSAGES.length));
      return () => clearInterval(interval);
    }
  }, [screen]);

  const renderWelcome = () => (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8 }}
      className="glass-card centered-card"
    >
      <motion.h1 className="main-title floating">🎉 Birthday Surprise 🎉</motion.h1>
      <p className="subtitle">Before entering, please verify your name.</p>
      
      <div className="input-wrapper">
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Enter Your Name"
          className="styled-input"
          onBlur={validateName}
          onKeyDown={(e) => e.key === "Enter" && validateName()}
        />
        {nameSuccess && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="success-icon">
            <Check size={24} />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {nameError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="error-message"
          >
            Oops 😅 This surprise isn't for you.
          </motion.p>
        )}
      </AnimatePresence>

      <button
        onClick={handleContinue}
        disabled={!nameSuccess}
        className="styled-button full-width"
      >
        Continue
      </button>
    </motion.div>
  );

  const renderBirthday = () => (
    <motion.div
      key="birthday"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1 }}
      className="birthday-container"
    >
      <motion.h1 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="main-title large-title"
      >
        🎂 Happy Birthday Pavithra M 🎂
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="quote"
      >
        "{quote}"
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="rewards-section"
      >
        <h2 className="section-title">Choose your birthday reward.</h2>
        <p className="section-subtitle">You can only choose ONE.</p>

        <div className="rewards-grid">
          {REWARDS.map((reward) => {
            const isSelected = selectedReward === reward.id;
            const isFaded = selectedReward !== null && !isSelected;
            return (
              <motion.div
                key={reward.id}
                whileHover={selectedReward === null ? { scale: 1.05 } : {}}
                whileTap={selectedReward === null ? { scale: 0.95 } : {}}
                onClick={() => handleRewardClick(reward.id)}
                className={`glass-card reward-card ${reward.cssClass} ${isSelected ? 'selected' : ''} ${isFaded ? 'faded' : 'floating'}`}
                style={{ animationDelay: `${reward.id * 0.2}s` }}
              >
                <div className="reward-icon">{reward.icon}</div>
                <h3 className="reward-title">{reward.title}</h3>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedReward !== null && confirmReward === null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                className="glass-card confirm-dialog"
              >
                <p className="confirm-text">Are you sure?<br/>You can choose only one.</p>
                <div className="confirm-buttons">
                  <button onClick={() => confirmSelection(selectedReward)} className="styled-button btn-yes">Yes</button>
                  <button onClick={() => setSelectedReward(null)} className="styled-button btn-no">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  const renderChoco = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

    return (
      <motion.div
        key="choco"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card centered-card"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="emoji-large"
        >
          🍫
        </motion.div>
        
        {timeLeft > 0 ? (
          <>
            <h2 className="section-title">Preparing your Choco Bar...</h2>
            <p className="section-subtitle">Please wait...</p>
            <div className="timer-text main-title">
              {timeStr}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={chocoMsgIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="loading-msg"
              >
                {CHOCO_MESSAGES[chocoMsgIndex]}
              </motion.p>
            </AnimatePresence>
          </>
        ) : (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <h2 className="main-title final-msg">Enjoy your surprise 🍫❤️</h2>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderCake = () => (
    <motion.div
      key="cake"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card centered-card"
    >
      <motion.div className="emoji-large relative">
        🎂
        {!candlesBlown && (
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }} 
            transition={{ duration: 0.5, repeat: Infinity }}
            className="flame"
          >
            🔥
          </motion.div>
        )}
      </motion.div>
      
      {!candlesBlown ? (
        <>
          <h2 className="section-title mb-large">Make a wish...</h2>
          <button 
            onClick={() => {
              setCandlesBlown(true);
              confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
            }}
            className="styled-button"
          >
            Blow Candles
          </button>
        </>
      ) : (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="main-title final-msg mb-small">Hope every wish comes true ❤️</h2>
          <p className="section-subtitle small-text">(Cue the birthday music 🎵)</p>
        </motion.div>
      )}
    </motion.div>
  );

  const renderGiftScreen = () => {
    return (
      <motion.div
        key="gift"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card centered-card"
      >
        {!giftOpened ? (
          <div className="pointer-wrap" onClick={() => setGiftOpened(true)}>
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="emoji-large floating"
            >
              🎁
            </motion.div>
            <p className="section-subtitle">Tap to open</p>
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex-center-col"
          >
            <div className="emoji-large">💖</div>
            <h2 className="gift-msg">
              "You must be very lucky...<br/>because you got me as your friend."
            </h2>
            <h3 className="main-title final-msg mt-large">Happy Birthday ❤️</h3>
            
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: -200, opacity: [0, 1, 0] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                className="floating-heart"
                style={{ left: `${20 + Math.random() * 60}%` }}
              >
                ❤️
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="app-wrapper">
      {screen !== "flower" && (
        <div className="bg-particles">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: "110vh", 
                x: `${Math.random() * 100}vw`,
                rotate: 0,
                opacity: Math.random() * 0.5 + 0.1
              }}
              animate={{ 
                y: "-10vh",
                rotate: 360,
              }}
              transition={{ 
                duration: 10 + Math.random() * 15,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10
              }}
              className="particle-flower"
            >
              🌸
            </motion.div>
          ))}
        </div>
      )}

      <div className="content-area">
        <AnimatePresence mode="wait">
          {screen === "welcome" && renderWelcome()}
          {screen === "birthday" && renderBirthday()}
          {screen === "choco" && renderChoco()}
          {screen === "cake" && renderCake()}
          {screen === "gift" && renderGiftScreen()}
        </AnimatePresence>
      </div>

      {screen === "flower" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flower-wrapper"
        >
          <FlowerWand />
          <button 
            onClick={() => {
              setScreen("birthday");
              setConfirmReward(null);
              setSelectedReward(null);
            }}
            className="styled-button back-btn"
          >
            Back
          </button>
        </motion.div>
      )}
    </div>
  );
}
