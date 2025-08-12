import { create } from 'zustand'

const useVoiceStore = create((set) => ({
  selectedVoice: 'ben',
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
}))

export default useVoiceStore;