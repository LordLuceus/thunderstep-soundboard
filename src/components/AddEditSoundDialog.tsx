"use client";

import { Sound } from "@/lib/types";

interface AddEditSoundDialogProps {
  editIndex: number | null;
  formData: Partial<Sound>;
  formError: string | null;
  filePreviewUrl: string | null;
  newCategoryName: string;
  categories: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  categorySelectRef: React.RefObject<HTMLSelectElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  setNewCategoryName: React.Dispatch<React.SetStateAction<string>>;
  handleAddCategory: () => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Sound>>>;
  closeForm: () => void;
}

export default function AddEditSoundDialog({
  editIndex,
  formData,
  formError,
  filePreviewUrl,
  newCategoryName,
  categories,
  fileInputRef,
  categorySelectRef,
  handleFileChange,
  handleFormSubmit,
  setNewCategoryName,
  handleAddCategory,
  setFormData,
  closeForm,
}: AddEditSoundDialogProps) {
  return (
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
        {formError && (
          <div style={{ color: "red", marginBottom: "0.5rem" }} role="alert">
            {formError}
          </div>
        )}
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
        {filePreviewUrl && (
          <div style={{ marginTop: "0.5rem" }}>
            <audio controls src={filePreviewUrl} style={{ width: "100%" }} />
          </div>
        )}
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
        <div style={{ marginBottom: "0.5rem" }}>
          <label style={{ marginRight: "0.5rem" }}>
            New Category:
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Add new..."
            />
          </label>
          <button type="button" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
            Add Category
          </button>
        </div>
        <div>
          <label>
            Category:
            <select
              ref={categorySelectRef}
              value={formData.category || ""}
              onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
              required
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
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
  );
}
