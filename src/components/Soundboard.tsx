"use client";

import { deleteFile, getFile, saveFile } from "@/lib/db";
import { useEffect, useRef, useState } from "react";
import AddEditSoundDialog from "./AddEditSoundDialog";
import AddBankDialog from "./AddBankDialog";
import RemoveBankDialog from "./RemoveBankDialog";
import RemoveSoundDialog from "./RemoveSoundDialog";

// Allow arbitrary categories (default categories were "sound" and "music")
type Category = string;

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
  const [formError, setFormError] = useState<string | null>(null);
  // preview URL for the selected file (before saving to IndexedDB)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  // Backup & restore
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Bank add/remove modals
  const [bankModal, setBankModal] = useState<"add" | "remove" | null>(null);
  const [bankNameInput, setBankNameInput] = useState("");
  // Sound delete confirmation
  const [soundToDelete, setSoundToDelete] = useState<number | null>(null);
  // Available categories (default + custom)
  const [categories, setCategories] = useState<Category[]>(["sound", "music"]);
  // Input state for creating new category
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  // Ref to the category select element for focus management
  const categorySelectRef = useRef<HTMLSelectElement>(null);

  // Handler to add a new category and select it
  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (!categories.includes(name)) {
      setCategories((prev) => [...prev, name]);
    }
    setFormData((p) => ({ ...p, category: name }));
    setNewCategoryName("");
    // After adding a category, move focus to the category select to keep focus within the modal
    setTimeout(() => {
      categorySelectRef.current?.focus();
    }, 0);
  };

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
        if (parsed.categories && Array.isArray(parsed.categories)) {
          setCategories(parsed.categories as Category[]);
        }
      } catch {}
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("soundboardData", JSON.stringify({ banks, currentBankIndex, categories }));
    } catch {}
  }, [banks, currentBankIndex, categories]);
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
    // Pause any playing audio in all categories
    Object.values(playingAudio.current).forEach((e) => e?.audio.pause());
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
    // reset form error when opening
    setFormError(null);
    if (sound) {
      setFormData(sound);
      setEditIndex(i!);
    } else {
      setFormData({ category: "sound" });
      setEditIndex(null);
    }
    setFilePreviewUrl(null);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setFormData({});
    setEditIndex(null);
    setFormError(null);
  };
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear previous error
    setFormError(null);
    // Validate required fields
    if (!formData.name || !formData.fileId || !formData.hotkey || !formData.category) {
      setFormError("Please fill in all required fields.");
      return;
    }
    // Ensure hotkey uniqueness within the current bank
    const newKey = (formData.hotkey as string).trim().toLowerCase();
    const existing = banks[currentBankIndex].sounds;
    const isDuplicate = existing.some((s, idx) => {
      if (editIndex != null && idx === editIndex) return false;
      return s.hotkey.trim().toLowerCase() === newKey;
    });
    if (isDuplicate) {
      setFormError(`Hotkey '${formData.hotkey}' is already used in this bank.`);
      return;
    }
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
  // Backup current boards and files to a JSON file
  const handleBackup = async () => {
    // Prepare data to back up: banks, associated files, and custom categories
    const data: {
      banks: SoundBank[];
      files: Record<string, string>;
      categories: Category[];
    } = { banks, files: {}, categories };
    // gather unique fileIds
    const fileIds = Array.from(new Set(banks.flatMap((b) => b.sounds.map((s) => s.fileId))));
    for (const fid of fileIds) {
      try {
        const blob = await getFile(fid);
        const reader = new FileReader();
        const url = await new Promise<string>((res, rej) => {
          reader.onload = () => res(reader.result as string);
          reader.onerror = () => rej(reader.error);
          reader.readAsDataURL(blob);
        });
        data.files[fid] = url;
      } catch (err) {
        console.error("Backup: failed to read file", fid, err);
      }
    }
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: "application/json" });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = "soundboard-backup.json";
    a.click();
    URL.revokeObjectURL(dlUrl);
  };

  // Restore from a backup JSON file
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      // Backup format: { banks, files: { [fileId]: dataUrl }, categories }
      const parsed = JSON.parse(text) as {
        banks: SoundBank[];
        files: Record<string, string>;
        categories?: Category[];
      };
      // restore files to IndexedDB
      for (const [fid, dataUrl] of Object.entries(parsed.files)) {
        const [meta, base64] = dataUrl.split(",");
        const mime = meta.split(":")[1].split(";")[0];
        const binary = atob(base64);
        const len = binary.length;
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i);
        const blob = new Blob([arr], { type: mime });
        await saveFile(fid, blob);
      }
      // restore banks metadata and custom categories
      setBanks(parsed.banks);
      setCurrentBankIndex(0);
      if (parsed.categories && Array.isArray(parsed.categories)) {
        setCategories(parsed.categories);
      }
      // Persist restored state (banks, current index, categories)
      localStorage.setItem(
        "soundboardData",
        JSON.stringify({ banks: parsed.banks, currentBankIndex: 0, categories: parsed.categories || categories }),
      );
    } catch (err) {
      console.error(err);
      setRestoreError("Failed to restore backup. Invalid file.");
    } finally {
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    }
  };

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
        <div style={{ marginTop: "1rem" }}>
          <button onClick={handleBackup}>Backup</button>
          <button onClick={() => restoreInputRef.current?.click()} style={{ marginLeft: "0.5rem" }}>
            Restore
          </button>
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            ref={restoreInputRef}
            onChange={handleRestoreFile}
          />
          {restoreError && (
            <div style={{ color: "red", marginTop: "0.5rem" }} role="alert">
              {restoreError}
            </div>
          )}
        </div>
        {showForm && (
          <AddEditSoundDialog
            editIndex={editIndex}
            formData={formData}
            formError={formError}
            filePreviewUrl={filePreviewUrl}
            newCategoryName={newCategoryName}
            categories={categories}
            fileInputRef={fileInputRef}
            categorySelectRef={categorySelectRef}
            handleFileChange={handleFileChange}
            handleFormSubmit={handleFormSubmit}
            setNewCategoryName={setNewCategoryName}
            handleAddCategory={handleAddCategory}
            setFormData={setFormData}
            closeForm={closeForm}
          />
        )}
        {bankModal === "add" && (
          <AddBankDialog
            bankNameInput={bankNameInput}
            setBankNameInput={setBankNameInput}
            onSubmit={handleAddBankConfirm}
            onCancel={cancelBankModal}
          />
        )}
        {bankModal === "remove" && (
          <RemoveBankDialog
            bankName={banks[currentBankIndex]?.name}
            onConfirm={handleRemoveBankConfirm}
            onCancel={cancelBankModal}
          />
        )}
        {soundToDelete != null && (
          <RemoveSoundDialog
            soundName={banks[currentBankIndex].sounds[soundToDelete]?.name}
            onConfirm={() => {
              removeSound(soundToDelete);
              setSoundToDelete(null);
            }}
            onCancel={() => setSoundToDelete(null)}
          />
        )}
      </main>
    </div>
  );
}
