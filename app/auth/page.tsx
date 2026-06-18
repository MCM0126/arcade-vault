"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  signIn,
  signUp,
  signInWithOAuth,
  signOut,
  getProfile,
  createProfile,
  PASSWORD_REGEX,
} from "@/lib/supabase/auth";

type PageState =
  | "login"
  | "register"
  | "choose-username"
  | "verified"
  | "loading";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos",
  "User already registered": "Ya existe una cuenta con ese email",
  "Email not confirmed": "Debes verificar tu email antes de entrar",
  "Username already taken": "Ese nombre ya está en uso, elige otro",
};

function mapError(msg: string): string {
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return val;
  }
  return msg;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Una mayúscula", ok: /[A-Z]/.test(password) },
    { label: "Una minúscula", ok: /[a-z]/.test(password) },
    { label: "Un número", ok: /\d/.test(password) },
    { label: "Un símbolo", ok: /[^a-zA-Z\d]/.test(password) },
  ];
  const allOk = PASSWORD_REGEX.test(password);
  return (
    <div
      style={{
        marginTop: 6,
        padding: "6px 10px",
        background: allOk ? "rgba(0,255,0,0.04)" : "rgba(255,0,128,0.04)",
        border: `1px solid ${allOk ? "var(--green)" : "rgba(255,0,128,0.3)"}`,
        borderRadius: 4,
      }}
    >
      {checks.map(({ label, ok }) => (
        <div
          key={label}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            color: ok ? "var(--green)" : "var(--ink-faint)",
            lineHeight: 1.7,
          }}
        >
          {ok ? "✓" : "✗"} {label}
        </div>
      ))}
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [tab, setTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    const verified = searchParams.get("verified");
    const authError = searchParams.get("error");

    if (authError) {
      setPageState("login");
      setError("Ocurrió un error durante la autenticación. Intenta de nuevo.");
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        if (verified) {
          setInfo("Cuenta verificada. Ahora puedes iniciar sesión.");
        }
        setPageState("login");
        return;
      }

      // Session exists — check for profile
      const profile = await getProfile(session.user.id);
      if (!profile) {
        // No profile yet (OAuth first login) — pick username
        setPageState("choose-username");
        return;
      }

      // Session + profile — redirect home
      router.replace("/");
    });
  }, [searchParams, supabase, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(mapError(err.message));
      setLoading(false);
      return;
    }
    router.replace("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.length < 3 || username.length > 10) {
      setError("El nombre debe tener entre 3 y 10 caracteres");
      return;
    }
    setLoading(true);
    const { data, error: err } = await signUp(email, password, username);
    setLoading(false);
    if (err) {
      setError(mapError(err.message));
      return;
    }
    // Supabase returns empty identities when email is already registered
    // (email enumeration protection prevents an explicit error)
    if (!data.user?.identities?.length) {
      setError("Ya existe una cuenta con ese email");
      return;
    }
    // Success — clear form and prompt to check email
    setEmail("");
    setPassword("");
    setUsername("");
    setTab("in");
    setInfo("Revisa tu email para verificar tu cuenta antes de entrar.");
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setError("");
    await signInWithOAuth(provider);
  };

  const handleChooseUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.length < 3 || username.length > 10) {
      setError("El nombre debe tener entre 3 y 10 caracteres");
      return;
    }
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Sesión expirada. Vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }
    const { error: err } = await createProfile(session.user.id, username);
    if (err) {
      setError(
        err.includes("unique") || err.includes("duplicate")
          ? "Ese nombre ya está en uso, elige otro"
          : mapError(err)
      );
      setLoading(false);
      return;
    }
    router.replace("/");
  };

  const handleGuest = async () => {
    await signOut();
    router.push("/");
  };

  if (pageState === "loading") {
    return (
      <div className="av-auth-wrap fade-in">
        <div className="auth-card">
          <div
            className="mono"
            style={{
              textAlign: "center",
              color: "var(--ink-faint)",
              fontSize: 11,
            }}
          >
            CARGANDO...
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "choose-username") {
    return (
      <div className="av-auth-wrap fade-in">
        <div className="auth-card">
          <div className="auth-header">
            <div className="mark" />
            <h2 className="neon-cyan">ARCADE VAULT</h2>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                letterSpacing: "0.16em",
                marginTop: 6,
              }}
            >
              ELIGE TU NOMBRE DE JUGADOR
            </div>
          </div>

          <form onSubmit={handleChooseUsername}>
            <div className="field">
              <label>Nombre (3–10 caracteres)</label>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="px_kai"
                autoFocus
              />
            </div>
            {error && (
              <div
                className="mono"
                style={{
                  color: "var(--magenta)",
                  fontSize: 11,
                  marginBottom: 8,
                }}
              >
                {error}
              </div>
            )}
            <button
              className="btn lg"
              type="submit"
              style={{ width: "100%", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? "GUARDANDO..." : "ENTRAR AL VAULT"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {info && (
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--cyan)",
              background: "rgba(0,255,255,0.06)",
              border: "1px solid var(--cyan)",
              borderRadius: 4,
              padding: "8px 12px",
              marginBottom: 12,
              letterSpacing: "0.08em",
            }}
          >
            {info}
          </div>
        )}

        <div className="auth-tabs">
          <button
            className={tab === "in" ? "on" : ""}
            onClick={() => {
              setTab("in");
              setError("");
            }}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "up" ? "on" : ""}
            onClick={() => {
              setTab("up");
              setError("");
            }}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={tab === "in" ? handleSignIn : handleSignUp}>
          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
              autoComplete="email"
            />
          </div>
          {tab === "up" && (
            <div className="field slide-in">
              <label>Nombre de jugador (3–10 caracteres)</label>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="px_kai"
              />
            </div>
          )}
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "in" ? "current-password" : "new-password"}
            />
            {tab === "up" && password.length > 0 && (
              <PasswordStrength password={password} />
            )}
          </div>

          {error && (
            <div
              className="mono"
              style={{ color: "var(--magenta)", fontSize: 11, marginBottom: 8 }}
            >
              {error}
            </div>
          )}

          <button
            className="btn lg"
            type="submit"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading
              ? "..."
              : tab === "in"
                ? "ENTRAR AL VAULT"
                : "CREAR Y JUGAR"}
          </button>
        </form>

        <button
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={handleGuest}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button
            className="btn ghost"
            type="button"
            onClick={() => handleOAuth("google")}
          >
            ◆&nbsp; GOOGLE
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => handleOAuth("github")}
          >
            ▣&nbsp; GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
