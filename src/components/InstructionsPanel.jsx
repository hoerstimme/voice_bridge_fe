import React, { useState } from 'react';

const CONTENT = {
  de: {
    toggleLabel: 'ℹ️ Anleitung',
    title: 'So funktioniert die Bedienung',
    steps: [
      {
        heading: '1. Stimme wählen',
        text: 'Wähle oben im Dropdown die gewünschte Zielstimme aus.',
      },
      {
        heading: '2. Modus wählen',
        text: 'Interval: sendet alle 2 Sekunden einen Ausschnitt. Silence-Based: sendet, sobald du eine kurze Sprechpause machst. Hybrid: Mischung aus beidem. Full Recording: nimmt alles auf und wandelt erst nach dem Stoppen um.',
      },
      {
        heading: '3. Aufnahme starten',
        text: 'Klicke auf „🎙️ Start" und erlaube den Mikrofonzugriff, falls gefragt. Sprich normal – die umgewandelte Stimme wird kurz danach automatisch abgespielt.',
      },
      {
        heading: '4. Aufnahme stoppen',
        text: 'Klicke auf „🛑 Stop", um die Aufnahme zu beenden.',
      },
    ],
  },
  en: {
    toggleLabel: 'ℹ️ Instructions',
    title: 'How to use this demo',
    steps: [
      {
        heading: '1. Choose a voice',
        text: 'Select the target voice from the dropdown at the top.',
      },
      {
        heading: '2. Choose a mode',
        text: 'Interval: sends a chunk every 2 seconds. Silence-Based: sends as soon as you pause speaking briefly. Hybrid: a mix of both. Full Recording: records everything and converts it only after you stop.',
      },
      {
        heading: '3. Start recording',
        text: 'Click "🎙️ Start" and allow microphone access if prompted. Speak normally — the converted voice will play back automatically shortly after.',
      },
      {
        heading: '4. Stop recording',
        text: 'Click "🛑 Stop" to end the recording.',
      },
    ],
  },
};

function InstructionsPanel() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState('de');
  const content = CONTENT[lang];

  return (
    <div className="max-w-xl mx-auto mb-4 px-4">
      <div className="flex items-center justify-between">
        <button
          className="text-sm text-blue-700 underline"
          onClick={() => setOpen(!open)}
        >
          {open ? '▲ ' : '▼ '}{content.toggleLabel}
        </button>
        <div className="flex gap-1 text-sm">
          <button
            className={`px-2 py-0.5 rounded ${lang === 'de' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
            onClick={() => setLang('de')}
          >
            DE
          </button>
          <button
            className={`px-2 py-0.5 rounded ${lang === 'en' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2 p-4 bg-white border rounded shadow-sm text-sm text-gray-700">
          <h2 className="font-semibold mb-2">{content.title}</h2>
          <ol className="space-y-2 list-none">
            {content.steps.map((step, i) => (
              <li key={i}>
                <span className="font-medium">{step.heading}</span>
                <br />
                {step.text}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default InstructionsPanel;