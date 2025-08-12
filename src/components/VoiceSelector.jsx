import React, { useEffect, useState } from 'react'
import useVoiceStore from './../store/useVoiceStore';

const VoiceSelector = () => {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const { selectedVoice, setSelectedVoice } = useVoiceStore();

  useEffect(() => {
    fetch('http://localhost:8001/available_voices')
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.voices.length > 0) {
          setVoices(data.voices);
          if (!selectedVoice) {
            setSelectedVoice(data.voices[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch voices:', err);
      });
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto flex flex-col gap-4">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex gap-4">
          <label htmlFor="voice">Choose Voice: </label>
          <select
            id="voice"
            className="border px-2 py-1"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
          >
            {voices.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
