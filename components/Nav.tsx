"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getProfile, signOut } from "@/lib/supabase/auth";
import type { Profile } from "@/lib/supabase/types";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      const p = await getProfile(userId);
      if (p) setProfile(p);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      // Fast path: username from JWT metadata (no DB round-trip)
      const metaUsername = session.user.user_metadata?.username as
        | string
        | undefined;
      if (metaUsername) {
        setProfile({
          id: session.user.id,
          username: metaUsername,
          avatar_url: null,
          created_at: "",
        });
      }
      loadProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        const metaUsername = session.user.user_metadata?.username as
          | string
          | undefined;
        if (metaUsername) {
          setProfile({
            id: session.user.id,
            username: metaUsername,
            avatar_url: null,
            created_at: "",
          });
        }
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    setProfile(null);
    router.push("/");
  };

  const isActive = (section: string) => {
    if (section === "inicio") return pathname === "/";
    if (section === "biblioteca") return pathname.startsWith("/games");
    if (section === "salon") return pathname === "/hall-of-fame";
    if (section === "about") return pathname === "/about";
    return false;
  };

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <nav className="av-nav">
        <div className="logo" onClick={() => go("/")}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </div>

        <div className="links">
          <Link href="/" className={isActive("inicio") ? "active" : ""}>
            Inicio
          </Link>
          <Link
            href="/games"
            className={isActive("biblioteca") ? "active" : ""}
          >
            Biblioteca
          </Link>
          <Link
            href="/hall-of-fame"
            className={isActive("salon") ? "active" : ""}
          >
            Salón de la Fama
          </Link>
          <Link href="/about" className={isActive("about") ? "active" : ""}>
            Sobre nosotros
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {profile ? (
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              className="btn ghost auth-btn"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              {profile.username.toUpperCase()} ▾
            </button>
            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  minWidth: 160,
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={handleSignOut}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 16px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    color: "var(--ink)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--line)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  CERRAR SESIÓN
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn auth-btn" onClick={() => go("/auth")}>
            Iniciar Sesión
          </button>
        )}

        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={() => setOpen(false)}
      />
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <a
          className={isActive("inicio") ? "active" : ""}
          style={{ cursor: "pointer" }}
          onClick={() => go("/")}
        >
          Inicio
        </a>
        <a
          className={isActive("biblioteca") ? "active" : ""}
          style={{ cursor: "pointer" }}
          onClick={() => go("/games")}
        >
          Biblioteca
        </a>
        <a
          className={isActive("salon") ? "active" : ""}
          style={{ cursor: "pointer" }}
          onClick={() => go("/hall-of-fame")}
        >
          Salón de la Fama
        </a>
        <a
          className={isActive("about") ? "active" : ""}
          style={{ cursor: "pointer" }}
          onClick={() => go("/about")}
        >
          Sobre nosotros
        </a>
        {profile ? (
          <a style={{ cursor: "pointer" }} onClick={handleSignOut}>
            Cerrar Sesión ({profile.username})
          </a>
        ) : (
          <a style={{ cursor: "pointer" }} onClick={() => go("/auth")}>
            Iniciar Sesión
          </a>
        )}
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
