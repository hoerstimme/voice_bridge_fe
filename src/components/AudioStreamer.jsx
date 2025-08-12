import React, { useRef, useState, useEffect } from 'react';
import useVoiceStore from "../store/useVoiceStore";


const START_SPEAKING_THRESHOLD = 0.05; // trigger when volume > this
const STOP_SPEAKING_THRESHOLD = 0.01;  // consider silence when volume < this
const SILENCE_DURATION_SEC = 1;

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


  const handleNewChunk = (arrayBuffer) => {
    chunkQueueRef.current.push(arrayBuffer);
    if (!isAppendingRef.current) {
      appendNextChunk();
    }
  };

  const appendNextChunk = () => {
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

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

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

      const now = Date.now();
      const volume = Math.sqrt(buffer.reduce((a, b) => a + b * b, 0) / buffer.length);
      console.log(volume);

      // Detect start of speech
      if (!isSpeaking && volume > START_SPEAKING_THRESHOLD) {
        isSpeaking = true;
        silenceStartTime = null;

        if (mode === 'silence') silenceBufferRef.current = [];
        if (mode === 'hybrid') hybridChunksRef.current = [];

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

        const timeSinceLastFlush = now - hybridLastFlushRef.current > 2000;

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
  };


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
