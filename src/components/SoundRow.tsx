import React from "react";
import { Sound } from "@/lib/types";

interface SoundRowProps {
  sound: Sound;
  onPlay: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleLoop: () => void;
}

export default function SoundRow({ sound, onPlay, onEdit, onRemove, onVolumeChange, onToggleLoop }: SoundRowProps) {
  return (
    <tr style={{ borderBottom: "1px solid #ccc" }}>
      <td>{sound.name}</td>
      <td>{sound.hotkey}</td>
      <td>{sound.category}</td>
      <td>
        <input
          aria-label={`Volume for ${sound.name}`}
          type="range"
          min={0}
          max={100}
          value={sound.volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
        />
        <span style={{ marginLeft: "0.5rem" }}>{sound.volume}</span>
      </td>
      <td>
        <input aria-label={`Loop for ${sound.name}`} type="checkbox" checked={sound.loop} onChange={onToggleLoop} />
      </td>
      <td>
        <button onClick={onEdit}>Edit</button>
        <button onClick={onRemove}>Remove</button>
        <button onClick={onPlay}>Play</button>
      </td>
    </tr>
  );
}
