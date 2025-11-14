/*
Ownership & License Notice

All code and related assets in this file are the intellectual property of
sinceare UG (haftungsbeschränkt), Berlin, Germany.

Released under the PolyForm Noncommercial License 1.0.0:
https://polyformproject.org/licenses/noncommercial/1.0.0/

- You may view, clone, and modify this code for personal, academic, or research use.
- Commercial use, sale, or integration in commercial applications is prohibited.
- You must include this license notice in any copies or derivatives.

For commercial or partnership inquiries, contact: ps@sinceare.com
*/


import React, { useRef, useState, useEffect } from 'react';
import useVoiceStore from "../store/useVoiceStore";

// put original values here
const START_SPEAKING_THRESHOLD = 0.018; // V1: 0.05,V2:0.03, V3: 0.02 trigger when volume > this
const STOP_SPEAKING_THRESHOLD = 0.010;  //V1:0.015,V2:0.015 consider silence when volume < this
const SILENCE_DURATION_SEC = 1; //V1: 1,V2:0.35
const HYBRID_FLUSH_INTERVAL = 2500; //V1: 1000 V2: 3000, V3:1500 (glucksend) made new variable in line  138
// NEW WebRTC constants
const USE_WEBRTC = true; // Toggle für WebRTC vs HTTP
const SIGNALING_SERVER = 'ws://127.0.0.1:8002'; // WebSocket für Signaling

function AudioStreamer() {
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState('interval'); // interval | silence | full | hybrid

  const audioContextRef = useRef(null);
  const sourceRef = useRef(null); 
  const processorRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const fullRecordingRef = useRef([]);
  const silenceBufferRef = useRef([]);
  const hybridChunksRef = useRef([]);
  const hybridLastFlushRef = useRef(Date.now());

  const audioRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const chunkQueueRef = useRef([]);
  const isAppendingRef = useRef(false);
  // NEW WebRTC refs
const peerConnectionRef = useRef(null);
const dataChannelRef = useRef(null);
const signalingSocketRef = useRef(null);

 // NEW Pre-roll constants and ref
  const PRE_ROLL_MS = 600; //V1:400
  const preRollRef = useRef([]);
  let preRollSamplesTarget = 0;
  // NEW End


  const handleNewChunk = (arrayBuffer) => {
    chunkQueueRef.current.push(arrayBuffer);
    if (!isAppendingRef.current) {
      appendNextChunk();
    }
  };

  // WebRTC Setup 
const setupWebRTC = async () => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  peerConnectionRef.current = pc;
  
  const dc = pc.createDataChannel('audio', {
    ordered: false,
    maxRetransmits: 0
  });
  dataChannelRef.current = dc;
  
  dc.onmessage = (event) => {
    // Chunk vom Backend empfangen
    handleNewChunk(event.data); // ← Nutzt deine bestehende Funktion!
  };
  
  // ... Rest des WebRTC Setup (Signaling etc.)
};

//OLD
/*   const appendNextChunk = () => {
    const sourceBuffer = sourceBufferRef.current;
    if (!sourceBuffer || sourceBuffer.updating) return;
    const queue = chunkQueueRef.current;
    if (!queue.length) {
      isAppendingRef.current = false;
      return;
    }
    const nextChunk = queue.shift();
    isAppendingRef.current = true;
    sourceBuffer.appendBuffer(nextChunk);
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  };
 */
//Old END

//NEW
const appendNextChunk = () => {
  const sourceBuffer = sourceBufferRef.current;
  if (!sourceBuffer) return;

  if (sourceBuffer.updating) {
    setTimeout(appendNextChunk, 30); // workaround, needs updateend event listener
    return;
  }


  const queue = chunkQueueRef.current;
  if (!queue.length) {
    isAppendingRef.current = false;
    return;
  }

  const nextChunk = queue.shift();
  isAppendingRef.current = true;

  try {
    sourceBuffer.appendBuffer(nextChunk);
  } catch (err) {
    console.warn("appendBuffer failed:", err);
    queue.unshift(nextChunk);
    setTimeout(appendNextChunk, 100);
    return;
  }

  if (audioRef.current && audioRef.current.paused && queue.length > 2) {
    audioRef.current.play().catch(() => {});
  }
};
//NEW END



  useEffect(() => {
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();

      fullRecordingRef.current = [];
      chunksRef.current = [];
      hybridChunksRef.current = [];
      silenceBufferRef.current = [];
  }, [mode]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    audioEl.src = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener('sourceopen', () => {
      const sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs="opus"');
      sourceBuffer.mode = 'sequence';
      sourceBufferRef.current = sourceBuffer;
      sourceBuffer.addEventListener('updateend', appendNextChunk);
    });
    return () => {
      if (mediaSourceRef.current?.readyState === 'open') {
        mediaSourceRef.current.endOfStream();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // NEW debug downloadBlob function START
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  };
// NEW debug downloadBlob function END

  // OLD processor-Function 
  /* const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    // NEW define pre-roll target *after* creating audioContext
    preRollSamplesTarget = Math.round(audioContext.sampleRate * (PRE_ROLL_MS / 1000));
    // NEW Ende 

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);

    if (mode === 'interval') {
      intervalRef.current = setInterval(() => {
        if (chunksRef.current.length) {
          const wavBlob = exportWAV(chunksRef.current, audioContext.sampleRate);
          chunksRef.current = [];
          sendChunk(wavBlob);
        }
      }, 2000);
    }

    let isSpeaking = false;
    let silenceStartTime = null;

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const buffer = new Float32Array(input);

      //  NEW Pre-roll handling
      // 🟢 PRE-ROLL: always fill the rolling buffer with latest samples
      preRollRef.current.push(buffer);
      let total = preRollRef.current.reduce((n, b) => n + b.length, 0);
      while (total > preRollSamplesTarget) {
      preRollRef.current.shift();
      total = preRollRef.current.reduce((n, b) => n + b.length, 0);
      }
      // NEW End

      const now = Date.now();
      const volume = Math.sqrt(buffer.reduce((a, b) => a + b * b, 0) / buffer.length);
      console.log(volume);

      // Detect start of speech
      if (!isSpeaking && volume > START_SPEAKING_THRESHOLD) {
        isSpeaking = true;
        silenceStartTime = null;
    // NEW: In silence and hybrid modes, prepend pre-roll buffers
      if (mode === 'silence') silenceBufferRef.current = [...preRollRef.current];
      if (mode === 'hybrid') hybridChunksRef.current = [...preRollRef.current];
      // NEW End 

    //OLD
      //if (mode === 'silence') silenceBufferRef.current = [];
      //if (mode === 'hybrid') hybridChunksRef.current = []; 
    //OLD Ende
        console.log("🎙️ Start speaking");
      }

      // Detect potential silence after speaking
      if (isSpeaking && volume < STOP_SPEAKING_THRESHOLD) {
        if (!silenceStartTime) silenceStartTime = now;
      } else if (volume >= STOP_SPEAKING_THRESHOLD) {
        silenceStartTime = null;
      }

      const silentLongEnough = silenceStartTime && (now - silenceStartTime > SILENCE_DURATION_SEC * 1000);

      // Silence mode
      if (mode === 'silence') {
        if (isSpeaking) {
          silenceBufferRef.current.push(buffer);
        }

        if (silentLongEnough && isSpeaking) {

            // NEW Overlap: letzten Buffer 1–2 mal anhängen
          for (let i = 0; i < 1; i++) {
          silenceBufferRef.current.push(new Float32Array(buffer));
         }
            // NEW Overlap End
    
          isSpeaking = false;
          silenceStartTime = null;

          if (silenceBufferRef.current.length > 0) {
            const wav = exportWAV(silenceBufferRef.current, audioContext.sampleRate);
            silenceBufferRef.current = [];
            sendChunk(wav);
          }
          console.log("⏹️ Stop speaking (silence mode)");
      }
      }

      // Hybrid mode
      if (mode === 'hybrid') {
        if (isSpeaking) {
          hybridChunksRef.current.push(buffer);
        }

        const timeSinceLastFlush = now - hybridLastFlushRef.current > HYBRID_FLUSH_INTERVAL;

        if (timeSinceLastFlush && volume < STOP_SPEAKING_THRESHOLD) {
          isSpeaking = false;
          silenceStartTime = null;
          hybridLastFlushRef.current = now;

          if (hybridChunksRef.current.length > 0) {
            const wav = exportWAV(hybridChunksRef.current, audioContext.sampleRate);
            hybridChunksRef.current = [];
            sendChunk(wav);
          }
          console.log("⏹️ Stop speaking / flush (hybrid mode)");
        }
      }

      // For interval/full modes, we still store raw chunks
      if (mode === 'interval' || mode === 'full') {
        chunksRef.current.push(buffer);
        fullRecordingRef.current.push(buffer);
      }
    };

    setRecording(true);
    sourceRef.current = source;
    processorRef.current = processor;
  };  */ 
  // OLD startRecording processor Ende

  // NEW AudioWorkletNode START
  const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaStreamRef.current = stream;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioContextRef.current = audioContext;

  // Pre-Roll setup
  preRollSamplesTarget = Math.round(audioContext.sampleRate * (PRE_ROLL_MS / 1000));

  const source = audioContext.createMediaStreamSource(stream);
  sourceRef.current = source;

  // 🎧 AudioWorklet laden
  await audioContext.audioWorklet.addModule("/processor.js");

  // 🎙️ Worklet-Node erstellen
  const vadNode = new AudioWorkletNode(audioContext, "vad-processor");
  source.connect(vadNode);
  vadNode.connect(audioContext.destination);
  processorRef.current = vadNode;

  let isSpeaking = false;
  let silenceStartTime = null;

  // Get data out of the AudioWorklet
  vadNode.port.onmessage = (event) => {
    const { volume, buffer } = event.data;
    const floatBuffer = new Float32Array(buffer);

    // --- Pre-Roll updating
    preRollRef.current.push(floatBuffer);
    let total = preRollRef.current.reduce((n, b) => n + b.length, 0);
    while (total > preRollSamplesTarget) {
      preRollRef.current.shift();
      total = preRollRef.current.reduce((n, b) => n + b.length, 0);
    }

    const now = Date.now();

    // --- Start Speaking
    if (!isSpeaking && volume > START_SPEAKING_THRESHOLD) {
      isSpeaking = true;
      silenceStartTime = null;

      if (mode === "silence") silenceBufferRef.current = [...preRollRef.current];
      if (mode === "hybrid") hybridChunksRef.current = [...preRollRef.current];

      console.log("🎙️ Start speaking");
    }

    // --- Silence Detection
    if (isSpeaking && volume < STOP_SPEAKING_THRESHOLD) {
      if (!silenceStartTime) silenceStartTime = now;
    } else if (volume >= STOP_SPEAKING_THRESHOLD) {
      silenceStartTime = null;
    }

    const silentLongEnough =
      silenceStartTime &&
      now - silenceStartTime > SILENCE_DURATION_SEC * 1000;

    // --- Silence Mode
    if (mode === "silence") {
      if (isSpeaking) silenceBufferRef.current.push(floatBuffer);

      if (silentLongEnough && isSpeaking) {
        // kleines Overlap für Natürlichkeit
        silenceBufferRef.current.push(new Float32Array(floatBuffer));
        isSpeaking = false;
        silenceStartTime = null;

        if (silenceBufferRef.current.length > 0) {
            const wav = exportWAV(
            silenceBufferRef.current,
            audioContext.sampleRate
          );
          // NEW downloadBlob call for debugging START
          downloadBlob(wav, 'debug.wav');
          // NEW downloadBlob call for debugging END
          silenceBufferRef.current = [];
          sendChunk(wav);
        }
        console.log("⏹️ Stop speaking (silence mode)");
      }
    }

    // --- Hybrid Mode
    if (mode === "hybrid") {
      if (isSpeaking) hybridChunksRef.current.push(floatBuffer);

      const timeSinceLastFlush =
        now - hybridLastFlushRef.current > HYBRID_FLUSH_INTERVAL;

      if (timeSinceLastFlush && volume < STOP_SPEAKING_THRESHOLD) {
        isSpeaking = false;
        silenceStartTime = null;
        hybridLastFlushRef.current = now;

        if (hybridChunksRef.current.length > 0) {
          const wav = exportWAV(
            hybridChunksRef.current,
            audioContext.sampleRate
          );
          hybridChunksRef.current = [];
          sendChunk(wav);
        }
        console.log("⏹️ Stop speaking / flush (hybrid mode)");
      }
    }

    // --- Interval / Full Mode
    if (mode === "interval" || mode === "full") {
      chunksRef.current.push(floatBuffer);
      fullRecordingRef.current.push(floatBuffer);
    }
  };

  // --- Interval Mode Chunk Flush
  if (mode === "interval") {
    intervalRef.current = setInterval(() => {
      if (chunksRef.current.length) {
        const wavBlob = exportWAV(chunksRef.current, audioContext.sampleRate);
        chunksRef.current = [];
        sendChunk(wavBlob);
      }
    }, 2000);
  }

  setRecording(true);
};

  //New AudioWorkletNode instead of ScriptProcessorNode ENDE



  const stopRecording = () => {
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current.close();
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setRecording(false);

    if (mode === 'full') {
      const fullBlob = exportWAV(fullRecordingRef.current, audioContextRef.current.sampleRate);
      sendChunk(fullBlob);
    }
  };

  const sendChunk = async (blob) => {
/*  //without WebRTC
    const formData = new FormData();
    formData.append('audio_file', blob, 'chunk.wav');
    formData.append('voice_name', useVoiceStore.getState().selectedVoice); 
    try {
      const response = await fetch('http://127.0.0.1:8001/convert_voice_stream_bytes_webm', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to convert audio');
      const arrayBuffer = await response.arrayBuffer();
      handleNewChunk(arrayBuffer);
    } catch (err) {
      console.error('Error sending chunk:', err);
    }
      */

    //Alternative with WebRTC V1
    if (USE_WEBRTC && dataChannelRef.current?.readyState === 'open') {
      const arrayBuffer = await blob.arrayBuffer();
      dataChannelRef.current.send(arrayBuffer);
    } else {
      // Dein bestehender HTTP Code bleibt!
      const formData = new FormData();
      formData.append('audio_file', blob, 'chunk.wav');
      formData.append('voice_name', useVoiceStore.getState().selectedVoice);
      const response = await fetch('http://127.0.0.1:8001/convert_voice_stream_bytes_webm', {
        method: 'POST',
        body: formData,
      });
    const arrayBuffer = await response.arrayBuffer();
    handleNewChunk(arrayBuffer);
    }
  };

  const exportWAV = (buffers, sampleRate) => {
    const length = buffers.reduce((sum, b) => sum + b.length, 0);
    const mergedBuffer = new Float32Array(length);
    let offset = 0;
    for (const b of buffers) {
      mergedBuffer.set(b, offset);
      offset += b.length;
    }
    const buffer = new ArrayBuffer(44 + mergedBuffer.length * 2);
    const view = new DataView(buffer);
    const writeString = (v, o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + mergedBuffer.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, mergedBuffer.length * 2, true);
 //NEW Fade-out
// Apply gentle fade-out over last 80 ms
    const fadeSamples = Math.round(sampleRate * 0.08); 
    for (let i = 0; i < fadeSamples; i++) {
      const idx = mergedBuffer.length - i - 1;
      if (idx >= 0) {
        const fadeFactor = 1- i / fadeSamples;
        mergedBuffer[idx] *= fadeFactor;
      }
    }
//NEW End 

    for (let i = 0, idx = 44; i < mergedBuffer.length; i++, idx += 2) {
      const s = Math.max(-1, Math.min(1, mergedBuffer[i]));
      view.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([view], { type: 'audio/wav' });
  };

  return (
    <div className="p-4 max-w-xl mx-auto flex flex-col gap-4">
      <div className="flex gap-2">
        <select
          className="border px-2 py-1"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={recording}
        >
          <option value="interval">Interval</option>
          <option value="silence">Silence-Based</option>
          <option value="hybrid">Hybrid</option>
          <option value="full">Full Recording</option>
        </select>
        <button
          className={`px-4 py-2 text-white rounded ${recording ? 'bg-red-600' : 'bg-green-600'}`}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? '🛑 Stop' : '🎙️ Start'}
        </button>
      </div>
      <audio ref={audioRef} controls autoPlay />
    </div>
  );
}

export default AudioStreamer;
