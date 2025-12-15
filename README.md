# 🍻 StudyBeer

**StudyBeer** is a gamified productivity app that flips the traditional reward loop:  
**you earn the reward only after the work is done**.

Instead of abstract points or streaks, users work toward a **real, chosen reward** (beer, coffee, pizza, boba, etc.), reinforcing accountability while keeping the experience intentionally simple and responsible.

This project was built end-to-end as a product + engineering exercise, with a focus on habit formation, UX clarity, and data integrity.

---

## ✨ Core Idea

Most productivity tools fail because:
- rewards feel artificial
- motivation decays quickly
- users reward themselves *before* finishing work

**StudyBeer fixes this by enforcing a contract with your future self.**  
Finish the tasks first → unlock the reward after.

---

## 🚀 Key Features

### 🎯 Task-Driven Progress
- Session-based task lists
- Tasks must be fully completed to earn a reward
- Automatic reset after completion

### 🏆 Reward System (No Currency)
- Choose a reward (beer, coffee, pizza, ice cream, etc.)
- Tasks visually “fill” the reward via animated progress
- One reward per completed session (configurable)

### 📊 Progress & History
- Lifetime rewards earned
- Reward breakdown by type
- Session history with timestamps
- (Optional) drill-down into tasks completed per session

### 🔐 Auth & Sync
- Secure authentication via Supabase
- User-scoped data with row-level security
- Real-time sync across devices

### 🌐 Cross-Platform
- iOS & Android via React Native (Expo)
- Web demo deployed for portfolio viewing

---

## 🧠 Why I Built This

I noticed that many students (myself included) reward themselves *before* completing meaningful work — which slowly erodes discipline.

I wanted to explore:
- how **behavioral design** can encourage follow-through
- how to keep motivation high without creating unhealthy incentives
- how to build a calm, focused productivity tool instead of a noisy one

StudyBeer is intentionally minimal:  
**clear rules, clear progress, clear reward.**

---

## 🛠️ Tech Stack

**Frontend**
- React Native (Expo)
- TypeScript
- Expo Router
- Animated UI components

**Backend**
- Supabase (Postgres + Auth)
- Row-Level Security (RLS)
- Session-based reward logging

**Web**
- Expo Web
- Deployed on Vercel

---

## 🧱 Data Model (High Level)

- `tasks` — active session tasks
- `drink_counters` — lifetime rewards earned
- `drinks_history` — per-session reward log
- `session_tasks` — completed tasks per session
- `reward_settings` — user’s selected reward

This structure allows:
- accurate session tracking
- reward analytics
- future expansion (limits, streaks, insights)

---

## 📈 Product Thinking Highlights

- Designed a **closed feedback loop** (effort → completion → reward)
- Removed abstract currencies to increase emotional payoff
- Prioritized data integrity (no double rewards, no race conditions)
- Built for extensibility (new rewards, analytics, social features)

---

## 🌍 Live Demo

👉 **Web demo:**  
[https://studybeer.vercel.app](#)  
*(Portfolio demo – mobile app available on request)*

---

## 🔮 Future Enhancements

- Focus timers (Pomodoro / deep work)
- Social accountability (friends, streak sharing)
- Reward limits & cooldowns
- Weekly insights & habit analytics
- Optional premium analytics tier

---

## 👤 Author

**Michael Dang**  
Product-minded engineer focused on building thoughtful, user-centric systems.

- Portfolio: https://michaeldang.me
- GitHub: https://github.com/therealMichaelD

---

## ⚠️ Disclaimer

StudyBeer promotes **responsible reward behavior**.  
Alcohol-based rewards are optional and can be replaced with non-alcoholic alternatives at any time.
