# Hörstimme – Real-Time Full-Duplex STT-TTS Audio Streaming
Status: 🚧 Work in Progress – Code is not yet cleaned up or finalized.

## About
Hörstimme is an open-source project for real-time, full-duplex audio streaming in the browser, featuring speech-to-text (STT) and text-to-speech (TTS) voice conversion. The system is designed for low-latency, interactive voice transformation and accessibility use cases.

## Current Development Branches
### Backend:
voice_bridge_be branch: feature/api-enhancements-voice-be
This branch contains the latest API improvements and backend streaming logic.

### Frontend:
voice_bridge_fe branch: feature/audio-chunking-optimizations
This branch includes the newest audio chunking, buffering, and streaming optimizations for the web client.

## ⚠️ Work-in-Process Notice
The codebase is under active development.
Many files and modules are not yet cleaned up or fully documented.
Breaking changes and refactors are likely as we optimize for real-time streaming and latency.


## Getting Started
# 🎙 ElevenLabs STS (Speech-to-Speech) - React Frontend

This repository contains a **React-based** frontend implementation for streaming microphone input to an ElevenLabs **Speech-to-Speech (STS)** backend.  
The application captures audio from the user's microphone, segments it using different modes (interval-based, silence-based, hybrid, or full recording), and sends it to the backend for STS processing.

---

## 🚀 Features

- **Real-time microphone capture** using Web Audio API.
- **Speech activity detection** based on volume thresholds.
- **Multiple recording modes**:
  - **Interval:** Send audio chunks every fixed interval (e.g., 2 seconds).
  - **Silence:** Send chunks when a pause in speech is detected.
  - **Hybrid:** Combines silence detection with periodic flushing.
  - **Full:** Records the entire session and sends it once recording stops.
- **Immediate playback** of returned processed audio from the backend.
- **Configurable thresholds** for speech start/stop detection.

---

## 📋 Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm (comes with Node.js) or yarn
- A running backend API compatible with **`/convert_voice_stream_bytes_webm`** endpoint.
- ElevenLabs API key configured on the backend.

---

## 🛠 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/hoerstimme/voice_bridge_fe.git
```

### 2️⃣ Install Project Dependencies
```bash
npm install
```


### 3️⃣ Start the Development Server
```bash
npm start
```

By default, the app will launch in your browser at:
http://localhost:3000

---
## Running in docker
1. Build docker image `docker build -t voice_bridge_fe`
2. Run the container `docker run -p 3000:3000 voice_bridge_fe`
3. You can access the website at http://localhost:3000
4. Make sure that backend is running at http://localhost:8001


## 🎛 Configuration

You can adjust detection parameters directly in AudioStreamer.js:

- const START_SPEAKING_THRESHOLD = 0.05; // Trigger when volume > this
- const STOP_SPEAKING_THRESHOLD = 0.01;  // Consider silence when volume < this
- const SILENCE_DURATION_SEC = 1;        // Silence length before sending chunk

## Available modes:

- interval
- silence
- hybrid
- full

## 🧩 How It Works

- **Capture Audio**
  - Microphone audio is captured using the navigator.mediaDevices.getUserMedia API.
- **Process Audio in Real-Time**
  - The app uses AudioContext and ScriptProcessorNode to analyze volume and detect speech start/stop events.
- **Segment Audio**
  - Depending on the selected mode, chunks are prepared and sent to the backend.
- **Backend Processing**
  - The backend (FastAPI) sends the chunk to ElevenLabs STS, receives processed audio, and streams it back.
- **Playback**
  - The received audio is appended to a MediaSource and played automatically in the browser.

## ⚠ Troubleshooting

- **No microphone access prompt**
  - Check browser permissions and ensure HTTPS is used if running in production.
- **No audio playback**
  - Ensure your backend is reachable and returning audio/webm or compatible formats.
- **Speech cuts off mid-word**
  - Adjust STOP_SPEAKING_THRESHOLD and SILENCE_DURATION_SEC in AudioStreamer.js.



## 🪪 License

The software is released under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/),  
which permits noncommercial use, modification, and distribution.

That means:

- ✅ You can **view, clone, and modify** the code for **personal, academic, or research use**.
- 🚫 You **cannot use, sell, or integrate** this code in **commercial applications**.
- 🧠 You must **include this license** in any copies or derivatives.

For commercial or partnership inquiries, please contact:  
📧 ps@sinceare.com

See the full license text at:  
🔗 [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)

## 🏢 Ownership

All code and related assets in this repository are the intellectual property of  
**sinceare UG (haftungsbeschränkt)**, Berlin, Germany.
