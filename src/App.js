import React from 'react';
import AudioStreamer from './components/AudioStreamer';
import VoiceSelector from './components/VoiceSelector';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

const Header = () => {
  const { lang, toggleLang, t } = useLanguage();
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <h1 className="text-2xl font-bold text-center">{t.title}</h1>
      <button
        className="px-3 py-1 text-sm rounded bg-gray-800 text-white"
        onClick={toggleLang}
      >
        {lang === 'en' ? 'DE' : 'EN'}
      </button>
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