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

🎛 Configuration

You can adjust detection parameters directly in AudioStreamer.js:

const START_SPEAKING_THRESHOLD = 0.05; // Trigger when volume > this
const STOP_SPEAKING_THRESHOLD = 0.01;  // Consider silence when volume < this
const SILENCE_DURATION_SEC = 1;        // Silence length before sending chunk

Available modes:

    interval
    silence
    hybrid
    full

🧩 How It Works

    Capture Audio
    Microphone audio is captured using the navigator.mediaDevices.getUserMedia API.
    Process Audio in Real-Time
    The app uses AudioContext and ScriptProcessorNode to analyze volume and detect speech start/stop events.
    Segment Audio
    Depending on the selected mode, chunks are prepared and sent to the backend.
    Backend Processing
    The backend (FastAPI) sends the chunk to ElevenLabs STS, receives processed audio, and streams it back.
    Playback
    The received audio is appended to a MediaSource and played automatically in the browser.

⚠ Troubleshooting

    No microphone access prompt
    Check browser permissions and ensure HTTPS is used if running in production.
    No audio playback
    Ensure your backend is reachable and returning audio/webm or compatible formats.
    Speech cuts off mid-word
    Adjust STOP_SPEAKING_THRESHOLD and SILENCE_DURATION_SEC in AudioStreamer.js.
