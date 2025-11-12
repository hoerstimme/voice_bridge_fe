// file: public/processor.js
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

class VADProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._frame = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // mono
    if (!channelData) return true;

    // Lautstärke berechnen (RMS)
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) sum += channelData[i] * channelData[i];
    const rms = Math.sqrt(sum / channelData.length);

    // Float32-Array kopieren, damit es sicher übertragbar ist
    const bufferCopy = new Float32Array(channelData);

    // Nachricht an Main-Thread schicken (mit zero-copy transfer)
    this.port.postMessage(
      { volume: rms, buffer: bufferCopy.buffer },
      [bufferCopy.buffer] // ownership transfer
    );

    this._frame++;
    return true;
  }
}

registerProcessor("vad-processor", VADProcessor);