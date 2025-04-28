import { getFile, saveFile } from "@/lib/db";
import { SoundBank } from "@/lib/types";
import { useRef, useState } from "react";

interface BackupRestoreProps {
  banks: SoundBank[];
  categories: string[];
  setBanks: React.Dispatch<React.SetStateAction<SoundBank[]>>;
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setCurrentBankIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function BackupRestore({
  banks,
  categories,
  setBanks,
  setCategories,
  setCurrentBankIndex,
}: BackupRestoreProps) {
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleBackup = async () => {
    const data: { banks: SoundBank[]; files: Record<string, string>; categories: string[] } = {
      banks,
      files: {},
      categories,
    };
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

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { banks: SoundBank[]; files: Record<string, string>; categories?: string[] };
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
      setBanks(parsed.banks);
      setCurrentBankIndex(0);
      if (parsed.categories && Array.isArray(parsed.categories)) {
        setCategories(parsed.categories);
      }
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
  );
}
