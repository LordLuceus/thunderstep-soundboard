"use client";

interface RemoveBankDialogProps {
  bankName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RemoveBankDialog({ bankName, onConfirm, onCancel }: RemoveBankDialogProps) {
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
      <div style={{ background: "#fff", padding: "1rem", borderRadius: "4px" }}>
        <h2>Remove Sound Bank</h2>
        <p>Remove bank &quot;{bankName}&quot;?</p>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={onConfirm} autoFocus>
            Yes
          </button>
          <button onClick={onCancel} style={{ marginLeft: "0.5rem" }}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}
