"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

// Sesión y puntuaciones simuladas en localStorage (sin backend).
// Claves heredadas de la plantilla: "av_user" y "av_scores".
const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";
// Evento propio para notificar cambios dentro de la misma pestaña
// ("storage" solo se dispara en las demás pestañas).
const CHANGE_EVENT = "av-session-change";

export interface SessionUser {
  name: string;
}

export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}

interface SessionActions {
  login: (user: SessionUser | null) => void;
  logout: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
}

interface SessionContextValue extends SessionActions {
  user: SessionUser | null;
}

// El contexto solo transporta las acciones (estables). El usuario NO viaja por contexto:
// cada consumidor lo lee con useSyncExternalStore para hidratarse con la instantánea del
// servidor aunque se hidrate más tarde que el provider (p. ej. dentro de un <Suspense>).
const SessionContext = createContext<SessionActions | null>(null);

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// Se devuelve el string crudo: es estable entre llamadas y evita renders infinitos.
function getSnapshot(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

// En el servidor y durante la hidratación no hay sesión: evita desajustes de hidratación.
function getServerSnapshot(): string | null {
  return null;
}

function parseUser(raw: string | null): SessionUser | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object" && typeof (value as SessionUser).name === "string") {
      return { name: (value as SessionUser).name };
    }
  } catch {}
  return null;
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const login = useCallback((next: SessionUser | null) => {
    try {
      if (next) localStorage.setItem(USER_KEY, JSON.stringify(next));
      else localStorage.removeItem(USER_KEY);
    } catch {}
    notify();
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
    notify();
  }, []);

  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => {
    try {
      const all: SavedScore[] = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {}
  }, []);

  const actions = useMemo(() => ({ login, logout, saveScore }), [login, logout, saveScore]);

  return <SessionContext.Provider value={actions}>{children}</SessionContext.Provider>;
}

const noopSubscribe = () => () => {};

/**
 * false en el servidor y durante la hidratación; true después.
 * Sirve para no enseñar el estado "sin sesión" mientras aún no se ha leído localStorage.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useSession(): SessionContextValue {
  const actions = useContext(SessionContext);
  if (!actions) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = useMemo(() => parseUser(raw), [raw]);
  return useMemo(() => ({ ...actions, user }), [actions, user]);
}
