import { SoundBank } from "@/lib/types";

interface BankListProps {
  banks: SoundBank[];
  currentBankIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: () => void;
}

export default function BankList({ banks, currentBankIndex, onSelect, onAdd, onRemove }: BankListProps) {
  return (
    <aside aria-label="Sound Banks" style={{ marginRight: "1rem", minWidth: "150px" }}>
      <h2>Sound Banks</h2>
      <ul>
        {banks.map((b, i) => (
          <li key={i}>
            <button onClick={() => onSelect(i)} aria-pressed={currentBankIndex === i}>
              {b.name}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onAdd}>Add Bank</button>
      <button onClick={onRemove} disabled={banks.length < 2}>
        Remove Bank
      </button>
    </aside>
  );
}
