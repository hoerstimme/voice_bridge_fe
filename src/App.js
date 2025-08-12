import React from 'react';
import AudioStreamer from './components/AudioStreamer';
import VoiceSelector from './components/VoiceSelector';


const App = () => {

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <h1 className="text-2xl font-bold text-center mb-6">Hör-Stimme: Voice Bridge</h1>
      <VoiceSelector />
      <AudioStreamer/>
    </div>
  );
}

export default App;