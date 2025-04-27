"use client";

interface AddBankDialogProps {
  bankNameInput: string;
  setBankNameInput: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function AddBankDialog({ bankNameInput, setBankNameInput, onSubmit, onCancel }: AddBankDialogProps) {
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
      <form onSubmit={onSubmit} style={{ background: "#fff", padding: "1rem", borderRadius: "4px" }}>
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
          <button type="button" onClick={onCancel} style={{ marginLeft: "0.5rem" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
