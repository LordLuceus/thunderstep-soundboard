import React from "react";

interface GlobalControlsProps {
  globalVolume: number;
  setGlobalVolume: (volume: number) => void;
  onStopAll: () => void;
}

export default function GlobalControls({ globalVolume, setGlobalVolume, onStopAll }: GlobalControlsProps) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <label htmlFor="globalVolume">Global Volume: {globalVolume}</label>
      <input
        id="globalVolume"
        type="range"
        min="0"
        max="100"
        value={globalVolume}
        onChange={(e) => setGlobalVolume(Number(e.target.value))}
      />
      <button onClick={onStopAll} style={{ marginLeft: "0.5rem" }}>
        Stop All
      </button>
    </div>
  );
}
