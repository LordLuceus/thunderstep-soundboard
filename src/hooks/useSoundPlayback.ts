import { useRef, useCallback, useEffect } from "react";
import { getFile } from "@/lib/db";
import { Sound } from "@/lib/types";

interface PlayingAudioEntry {
  audio: HTMLAudioElement;
  soundId: string;
  volume: number;
}

export function useSoundPlayback(globalVolume: number) {
  const playingAudio = useRef<Partial<Record<string, PlayingAudioEntry>>>({});
  // Adjust volumes when globalVolume changes
  useEffect(() => {
    Object.values(playingAudio.current).forEach((entry) => {
      if (entry) {
        entry.audio.volume = (entry.volume / 100) * (globalVolume / 100);
      }
    });
  }, [globalVolume]);

  const playSound = useCallback(
    async (sound: Sound) => {
      const { category, fileId } = sound;
      const prev = playingAudio.current[category];
      if (prev) {
        prev.audio.pause();
        delete playingAudio.current[category];
      }
      try {
        const blob = await getFile(fileId);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.loop = sound.loop;
        audio.volume = (sound.volume / 100) * (globalVolume / 100);
        playingAudio.current[category] = { audio, soundId: sound.id, volume: sound.volume };
        audio.play();
      } catch (err) {
        console.error("Error fetching audio from IndexedDB", err);
      }
    },
    [globalVolume],
  );

  const stopAll = useCallback(() => {
    Object.values(playingAudio.current).forEach((entry) => entry?.audio.pause());
    playingAudio.current = {};
  }, []);

  const changeVolume = useCallback(
    (sound: Sound, volume: number) => {
      const entry = playingAudio.current[sound.category];
      if (entry && entry.soundId === sound.id) {
        entry.volume = volume;
        entry.audio.volume = (volume / 100) * (globalVolume / 100);
      }
    },
    [globalVolume],
  );

  const toggleLoop = useCallback((sound: Sound) => {
    const entry = playingAudio.current[sound.category];
    if (entry && entry.soundId === sound.id) {
      entry.audio.loop = sound.loop;
    }
  }, []);

  const stopSound = useCallback((sound: Sound) => {
    const entry = playingAudio.current[sound.category];
    if (entry && entry.soundId === sound.id) {
      entry.audio.pause();
      delete playingAudio.current[sound.category];
    }
  }, []);

  return { playSound, stopAll, changeVolume, toggleLoop, stopSound };
}
