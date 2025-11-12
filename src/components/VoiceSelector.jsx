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

import React, { useEffect, useState } from 'react'
import useVoiceStore from './../store/useVoiceStore';


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
