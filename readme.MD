# Magic Bot

Magic Bot is a terminal based AI chat application built using [Ink.js](https://github.com/vadimdemedes/ink), allowing you to create rich terminal user interfaces with **React components and hooks**, all running entirely in a **Node.js environment**.

The terminal application acts as the **UI layer** and communicates with a **separate backend service**. User input is sent from the terminal to the backend, which processes the request and **streams the AI response back in real time**. Ink then reactively renders this streamed output in the terminal, creating a smooth, chat-like experience.

---

## Project Structure

- **`fe`**: Terminal UI built with Ink.js
- **`server`**: Backend API built with Hono that handles AI requests and streaming responses

---

## Prerequisites

- Node.js **v18 or later** (recommended)
- npm / pnpm / yarn
- A valid **Gemini API key**

---

## Clone the Repository

git clone https://github.com/AnasSiddiqui18/magic-bot.git
cd magic-bot

---

## Environment Variables

Create a `.env` file inside the **server** directory:

cd server
touch .env

Add the following variable to `.env`:

GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

---

## Install Dependencies

### Backend (Hono Server)

`cd server && npm install`

### Frontend (Ink CLI)

`cd ../fe && npm install`

---

## Running the Project

### 1. Start the Backend Server

cd server
npm run dev

This starts the Hono backend, which streams AI responses using the Vercel AI SDK.

### 2. Start the Terminal Frontend

cd fe
npm run dev

This launches the Ink-based terminal UI.

---

## How It Works

1. The user enters a prompt in the terminal.
2. The Ink frontend sends the input to the Hono backend.
3. The backend calls the Gemini model.
4. The AI response is streamed chunk-by-chunk back to the frontend.
5. Ink reactively updates the terminal output in real time.

---

## Notes

- Runs entirely in **Node.js** (no browser, no DOM).
- Uses **React hooks** for state management and streaming updates.
- Designed for a **low-latency, real-time terminal chat experience**.

---
