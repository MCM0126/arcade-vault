"use client";

import type { SkinId } from "@/lib/games/skins";

interface Props {
  gameId: string;
  skin: SkinId;
  onChange: (skin: SkinId) => void;
}

const SKIN_OPTIONS: { id: SkinId; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "neon", label: "Neon" },
  { id: "retro", label: "Retro" },
];

export default function SkinSelector({
  gameId: _gameId,
  skin,
  onChange,
}: Props) {
  return (
    <div className="skin-selector">
      <label htmlFor="skin-select" className="skin-label">
        SKIN
      </label>
      <select
        id="skin-select"
        className="skin-select"
        value={skin}
        onChange={(e) => onChange(e.target.value as SkinId)}
      >
        {SKIN_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>

      <style>{`
        .skin-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .skin-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          color: var(--ink-dim);
          white-space: nowrap;
        }
        .skin-select {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--cyan);
          background: transparent;
          border: 1px solid var(--cyan);
          border-radius: 4px;
          padding: 3px 24px 3px 8px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2300f5ff'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 7px center;
          background-size: 8px 5px;
          outline: none;
          transition: border-color 0.15s;
        }
        .skin-select:hover {
          border-color: var(--ink);
          color: var(--ink);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23ffffff'/%3E%3C/svg%3E");
        }
        .skin-select:focus {
          border-color: var(--cyan);
          box-shadow: 0 0 0 2px rgba(0, 245, 255, 0.15);
        }
        .skin-select option {
          background: #0a0a12;
          color: var(--ink);
        }
      `}</style>
    </div>
  );
}
