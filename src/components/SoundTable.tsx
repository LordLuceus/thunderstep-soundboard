import React from "react";
import { Sound } from "@/lib/types";
import SoundRow from "./SoundRow";

interface SoundTableProps {
  sounds: Sound[];
  onPlay: (sound: Sound) => void;
  onEdit: (sound: Sound, index: number) => void;
  onRemove: (index: number) => void;
  onVolumeChange: (index: number, volume: number) => void;
  onToggleLoop: (index: number) => void;
  onStop: (sound: Sound) => void;
}

export default function SoundTable({
  sounds,
  onPlay,
  onEdit,
  onRemove,
  onVolumeChange,
  onToggleLoop,
  onStop,
}: SoundTableProps) {
  return (
    <table aria-label="Sounds Table" style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Hotkey</th>
          <th>Category</th>
          <th>Volume</th>
          <th>Loop</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {sounds.map((sound, idx) => (
          <SoundRow
            key={sound.id}
            sound={sound}
            onPlay={() => onPlay(sound)}
            onEdit={() => onEdit(sound, idx)}
            onRemove={() => onRemove(idx)}
            onVolumeChange={(vol) => onVolumeChange(idx, vol)}
            onToggleLoop={() => onToggleLoop(idx)}
            onStop={() => onStop(sound)}
          />
        ))}
      </tbody>
    </table>
  );
}
