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