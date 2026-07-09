import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

function InstructionsPanel() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="mt-4">
      <button
        className="text-base font-medium text-blue-700 underline"
        onClick={() => setOpen(!open)}
      >
        {open ? '▲ ' : '▼ '}{t.instructionsToggle}
      </button>

      {open && (
        <div className="mt-2 p-4 bg-white border rounded shadow-sm text-sm text-gray-700">
          <h2 className="font-semibold mb-2">{t.instructionsTitle}</h2>
          <ol className="space-y-2 list-none">
            {t.steps.map((step, i) => (
              <li key={i}>
                <span className="font-medium">{step.heading}</span>
                <br />
                <span className="whitespace-pre-line">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default InstructionsPanel;