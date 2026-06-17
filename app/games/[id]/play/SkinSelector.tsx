"use client";

import type { SkinId } from "@/lib/games/skins";
import { ASTEROIDES_SKINS } from "@/lib/games/skins";

interface SkinOption {
  id: SkinId;
  label: string;
}

const SKIN_OPTIONS: SkinOption[] = [
  { id: "classic", label: "CLASSIC" },
  { id: "neon", label: "NEON" },
  { id: "retro", label: "RETRO" },
];

interface Props {
  gameId: string;
  skin: SkinId;
  onChange: (skin: SkinId) => void;
}

/**
 * Returns the preview palette for a given game + skin.
 * Falls back to asteroides if the game has no registered skins yet.
 */
function getPreviewColors(
  _gameId: string,
  skinId: SkinId
): { fondo: string; nave: string } {
  // Currently only asteroides has skins; future games can add entries here.
  const palette = ASTEROIDES_SKINS[skinId];
  return {
    fondo: palette["fondo"],
    nave: palette["nave"],
  };
}

export default function SkinSelector({ gameId, skin, onChange }: Props) {
  return (
    <div className="skin-selector">
      <span className="skin-label">SKIN</span>
      <div className="skin-options">
        {SKIN_OPTIONS.map((opt) => {
          const { fondo, nave } = getPreviewColors(gameId, opt.id);
          const isActive = skin === opt.id;
          return (
            <button
              key={opt.id}
              className={`skin-btn${isActive ? " skin-btn--active" : ""}`}
              onClick={() => onChange(opt.id)}
              title={opt.label}
              aria-pressed={isActive}
            >
              <span
                className="skin-preview"
                style={{ background: fondo, borderColor: nave }}
              >
                <span
                  className="skin-preview-dot"
                  style={{ background: nave }}
                />
              </span>
              <span className="skin-btn-label">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .skin-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }
        .skin-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          color: var(--ink-dim);
          white-space: nowrap;
        }
        .skin-options {
          display: flex;
          gap: 6px;
        }
        .skin-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px 4px 6px;
          border: 1px solid var(--ink-faint);
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          color: var(--ink-dim);
        }
        .skin-btn:hover {
          border-color: var(--ink-dim);
          color: var(--ink);
        }
        .skin-btn--active {
          border-color: var(--cyan);
          color: var(--cyan);
          background: rgba(0, 245, 255, 0.07);
        }
        .skin-preview {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 3px;
          border: 1.5px solid;
          flex-shrink: 0;
        }
        .skin-preview-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .skin-btn-label {
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
