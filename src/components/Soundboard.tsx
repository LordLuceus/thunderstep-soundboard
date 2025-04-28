"use client";

import { useSoundPlayback } from "@/hooks/useSoundPlayback";
import { deleteFile, saveFile } from "@/lib/db";
import { Sound, SoundBank } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import AddBankDialog from "./AddBankDialog";
import AddEditSoundDialog from "./AddEditSoundDialog";
import BackupRestore from "./BackupRestore";
import BankList from "./BankList";
import GlobalControls from "./GlobalControls";
import RemoveBankDialog from "./RemoveBankDialog";
import RemoveSoundDialog from "./RemoveSoundDialog";
import SoundTable from "./SoundTable";

export default function SoundboardPage() {
  const [banks, setBanks] = useState<SoundBank[]>([{ name: "Default", sounds: [] }]);
  const [currentBankIndex, setCurrentBankIndex] = useState(0);
  const [globalVolume, setGlobalVolume] = useState(100);
  const {
    playSound,
    stopAll,
    changeVolume: changePlaybackVolume,
    toggleLoop,
    stopSound,
  } = useSoundPlayback(globalVolume);

  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Sound>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bankModal, setBankModal] = useState<"add" | "remove" | null>(null);
  const [bankNameInput, setBankNameInput] = useState("");
  const [soundToDelete, setSoundToDelete] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>(["sound", "music"]);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const categorySelectRef = useRef<HTMLSelectElement>(null);

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
        if (e.shiftKey) {
          stopSound(sound);
        } else {
          playSound(sound);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [banks, currentBankIndex, playSound, stopAll, stopSound]);

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
          setCategories(parsed.categories as string[]);
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
    toggleLoop({ ...snd, loop: newLoop });
  };

  const handleChangeVolume = (i: number, vol: number) => {
    const snd = banks[currentBankIndex].sounds[i];
    setBanks((prev) => {
      const nb = [...prev];
      const ss = [...nb[currentBankIndex].sounds];
      ss[i] = { ...ss[i], volume: vol };
      nb[currentBankIndex] = { ...nb[currentBankIndex], sounds: ss };
      return nb;
    });
    changePlaybackVolume(snd, vol);
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
      category: formData.category,
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
      <BankList
        banks={banks}
        currentBankIndex={currentBankIndex}
        onSelect={setCurrentBankIndex}
        onAdd={addBank}
        onRemove={removeBank}
      />
      <main style={{ flex: 1 }}>
        <h2>Bank: {banks[currentBankIndex].name}</h2>
        <button onClick={() => openForm()}>Add Sound</button>
        <SoundTable
          sounds={banks[currentBankIndex].sounds}
          onPlay={playSound}
          onEdit={openForm}
          onRemove={setSoundToDelete}
          onVolumeChange={handleChangeVolume}
          onToggleLoop={handleToggleLoop}
          onStop={stopSound}
        />
        <GlobalControls globalVolume={globalVolume} setGlobalVolume={setGlobalVolume} onStopAll={stopAll} />
        <BackupRestore
          banks={banks}
          categories={categories}
          setBanks={setBanks}
          setCategories={setCategories}
          setCurrentBankIndex={setCurrentBankIndex}
        />
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
