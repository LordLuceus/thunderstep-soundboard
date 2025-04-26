"use client";

import React, { useEffect, useRef, useState } from "react";
import { deleteFile, getFile, saveFile } from "../lib/db";

type Category = "sound" | "music";

interface Sound {
  id: string;
  name: string;
  // fileId references a Blob stored in IndexedDB
  fileId: string;
  hotkey: string;
  category: Category;
  volume: number;
  loop: boolean;
}

interface SoundBank {
  name: string;
  sounds: Sound[];
}

export default function SoundboardPage() {
  const [banks, setBanks] = useState<SoundBank[]>([{ name: "Default", sounds: [] }]);
  const [currentBankIndex, setCurrentBankIndex] = useState(0);
  const [globalVolume, setGlobalVolume] = useState(100);
  const playingAudio = useRef<Partial<Record<Category, { audio: HTMLAudioElement; soundId: string }>>>({});

  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Sound>>({});
  // preview URL for the selected file (before saving to IndexedDB)
  const [, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Bank add/remove modals
  const [bankModal, setBankModal] = useState<"add" | "remove" | null>(null);
  const [bankNameInput, setBankNameInput] = useState("");
  // Sound delete confirmation
  const [soundToDelete, setSoundToDelete] = useState<number | null>(null);

  // keyboard & persistence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stopAll();
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      const key = e.key.toLowerCase();
      const sound = banks[currentBankIndex].sounds.find((s) => s.hotkey.toLowerCase() === key);
      if (sound) {
        e.preventDefault();
        playSound(sound);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banks, currentBankIndex, globalVolume]);
  useEffect(() => {
    const saved = localStorage.getItem("soundboardData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.banks) {
          setBanks(parsed.banks as SoundBank[]);
          const idx = typeof parsed.currentBankIndex === "number" ? parsed.currentBankIndex : 0;
          setCurrentBankIndex(idx >= 0 && idx < parsed.banks.length ? idx : 0);
        }
      } catch {}
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("soundboardData", JSON.stringify({ banks, currentBankIndex }));
    } catch {}
  }, [banks, currentBankIndex]);
  useEffect(() => {
    if (showForm && fileInputRef.current) {
      fileInputRef.current.focus();
    }
  }, [showForm]);

  const playSound = async (sound: Sound) => {
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
      playingAudio.current[category] = { audio, soundId: sound.id };
      audio.play();
    } catch (err) {
      console.error("Error fetching audio from IndexedDB", err);
    }
  };
  const stopAll = () => {
    Object.values(playingAudio.current).forEach((e) => e.audio.pause());
    playingAudio.current = {};
  };
  const handleToggleLoop = (i: number) => {
    const snd = banks[currentBankIndex].sounds[i];
    const newLoop = !snd.loop;
    setBanks((prev) => {
      const nb = [...prev];
      const ss = [...nb[currentBankIndex].sounds];
      ss[i] = { ...ss[i], loop: newLoop };
      nb[currentBankIndex] = { ...nb[currentBankIndex], sounds: ss };
      return nb;
    });
    const entry = playingAudio.current[snd.category];
    if (entry && entry.soundId === snd.id) entry.audio.loop = newLoop;
  };
  const handleChangeVolume = (i: number, vol: number) => {
    const snd = banks[currentBankIndex].sounds[i];
    const cat = snd.category;
    const id = snd.id;
    setBanks((prev) => {
      const nb = [...prev];
      const ss = [...nb[currentBankIndex].sounds];
      ss[i] = { ...ss[i], volume: vol };
      nb[currentBankIndex] = { ...nb[currentBankIndex], sounds: ss };
      return nb;
    });
    const entry = playingAudio.current[cat];
    if (entry && entry.soundId === id) entry.audio.volume = (vol / 100) * (globalVolume / 100);
  };
  const openForm = (sound?: Sound, i?: number) => {
    if (sound) {
      setFormData(sound);
      setEditIndex(i!);
    } else {
      setFormData({ category: "sound" });
    }
    setFilePreviewUrl(null);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setFormData({});
    setEditIndex(null);
  };
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.fileId || !formData.hotkey || !formData.category) return;
    const newSound: Sound = {
      id: editIndex != null ? banks[currentBankIndex].sounds[editIndex].id : Date.now().toString(),
      name: formData.name as string,
      fileId: formData.fileId as string,
      hotkey: (formData.hotkey as string).toLowerCase(),
      category: formData.category as Category,
      volume: formData.volume ?? 100,
      loop: formData.loop ?? false,
    };
    setBanks((prev) => {
      const nb = [...prev];
      const ss = [...nb[currentBankIndex].sounds];
      if (editIndex != null) ss[editIndex] = newSound;
      else ss.push(newSound);
      nb[currentBankIndex] = { ...nb[currentBankIndex], sounds: ss };
      return nb;
    });
    closeForm();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fid = Date.now().toString();
    try {
      await saveFile(fid, file);
      setFilePreviewUrl(URL.createObjectURL(file));
      setFormData((p) => ({ ...p, fileId: fid, name: p.name || file.name }));
    } catch (err) {
      console.error(err);
    }
  };
  const removeSound = (i: number) => {
    const snd = banks[currentBankIndex].sounds[i];
    setBanks((prev) => {
      const nb = [...prev];
      const ss = [...nb[currentBankIndex].sounds];
      ss.splice(i, 1);
      nb[currentBankIndex] = { ...nb[currentBankIndex], sounds: ss };
      return nb;
    });
    deleteFile(snd.fileId).catch(console.error);
  };
  const addBank = () => {
    setBankNameInput("");
    setBankModal("add");
  };
  const removeBank = () => {
    if (banks.length > 1) setBankModal("remove");
  };
  const handleAddBankConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNameInput.trim()) return;
    setBanks((prev) => [...prev, { name: bankNameInput.trim(), sounds: [] }]);
    setCurrentBankIndex(banks.length);
    setBankModal(null);
  };
  const handleRemoveBankConfirm = () => {
    setBanks((prev) => prev.filter((_, i) => i !== currentBankIndex));
    setCurrentBankIndex(0);
    setBankModal(null);
  };
  const cancelBankModal = () => setBankModal(null);

  return (
    <div style={{ display: "flex", padding: "1rem" }}>
      <aside aria-label="Sound Banks" style={{ marginRight: "1rem", minWidth: "150px" }}>
        <h2>Sound Banks</h2>
        <ul>
          {banks.map((b, i) => (
            <li key={i}>
              <button onClick={() => setCurrentBankIndex(i)} aria-pressed={currentBankIndex === i}>
                {b.name}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={addBank}>Add Bank</button>
        <button onClick={removeBank} disabled={banks.length < 2}>
          Remove Bank
        </button>
      </aside>
      <main style={{ flex: 1 }}>
        <h2>Bank: {banks[currentBankIndex].name}</h2>
        <button onClick={() => openForm()}>Add Sound</button>
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
            {banks[currentBankIndex].sounds.map((sound, idx) => (
              <tr key={sound.id} style={{ borderBottom: "1px solid #ccc" }}>
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
                    onChange={(e) => handleChangeVolume(idx, Number(e.target.value))}
                  />{" "}
                  <span style={{ marginLeft: "0.5rem" }}>{sound.volume}</span>
                </td>
                <td>
                  <input
                    aria-label={`Loop for ${sound.name}`}
                    type="checkbox"
                    checked={sound.loop}
                    onChange={() => handleToggleLoop(idx)}
                  />
                </td>
                <td>
                  <button onClick={() => openForm(sound, idx)}>Edit</button>
                  <button onClick={() => setSoundToDelete(idx)}>Remove</button>
                  <button onClick={() => playSound(sound)}>Play</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        </div>
        {showForm && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <form onSubmit={handleFormSubmit} style={{ background: "#fff", padding: "1rem", borderRadius: "4px" }}>
              <h2>{editIndex != null ? "Edit Sound" : "Add Sound"}</h2>
              <div>
                <label>
                  File:
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    required={!formData.fileId}
                  />
                </label>
              </div>
              <div>
                <label>
                  Name:
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Hotkey:
                  <input
                    type="text"
                    value={formData.hotkey || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, hotkey: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Category:
                  <select
                    value={formData.category || "sound"}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as Category }))}
                  >
                    <option value="sound">sound</option>
                    <option value="music">music</option>
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Volume: {formData.volume ?? 100}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.volume ?? 100}
                    onChange={(e) => setFormData((p) => ({ ...p, volume: Number(e.target.value) }))}
                  />
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.loop || false}
                    onChange={(e) => setFormData((p) => ({ ...p, loop: e.target.checked }))}
                  />{" "}
                  Loop
                </label>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button type="submit">Save</button>
                <button type="button" onClick={closeForm} style={{ marginLeft: "0.5rem" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {bankModal === "add" && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <form onSubmit={handleAddBankConfirm} style={{ background: "#fff", padding: "1rem", borderRadius: "4px" }}>
              <h2>Add Sound Bank</h2>
              <div>
                <label>
                  Name:
                  <input
                    type="text"
                    autoFocus
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button type="submit">Add</button>
                <button type="button" onClick={cancelBankModal} style={{ marginLeft: "0.5rem" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {bankModal === "remove" && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div style={{ background: "#fff", padding: "1rem", borderRadius: "4px" }}>
              <h2>Remove Sound Bank</h2>
              <p>Remove bank &quot;{banks[currentBankIndex]?.name}&quot;?</p>
              <div style={{ marginTop: "1rem" }}>
                <button onClick={handleRemoveBankConfirm} autoFocus>
                  Yes
                </button>
                <button onClick={cancelBankModal} style={{ marginLeft: "0.5rem" }}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}
        {soundToDelete != null && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div style={{ background: "#fff", padding: "1rem", borderRadius: "4px" }}>
              <h2>Remove Sound</h2>
              <p>Remove sound &quot;{banks[currentBankIndex].sounds[soundToDelete]?.name}&quot;?</p>
              <div style={{ marginTop: "1rem" }}>
                <button
                  onClick={() => {
                    removeSound(soundToDelete);
                    setSoundToDelete(null);
                  }}
                  autoFocus
                >
                  Yes
                </button>
                <button onClick={() => setSoundToDelete(null)} style={{ marginLeft: "0.5rem" }}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
