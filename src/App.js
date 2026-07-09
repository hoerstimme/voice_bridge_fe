import React from 'react';
import AudioStreamer from './components/AudioStreamer';
import VoiceSelector from './components/VoiceSelector';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

const Header = () => {
  const { lang, toggleLang, t } = useLanguage();
  return (
    <div className="max-w-xl mx-auto mb-6 px-4 text-center">
      <div className="flex items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <button
          className="px-3 py-1 text-sm rounded bg-gray-800 text-white"
          onClick={toggleLang}
        >
          {lang === 'en' ? 'DE' : 'EN'}
        </button>
      </div>
      <p className="mt-3 text-gray-600 text-sm whitespace-pre-line text-justify">{t.intro}</p>
    </div>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-50 py-10">
        <Header />
        <VoiceSelector />
        <AudioStreamer />
      </div>
    </LanguageProvider>
  );
}

export default App;