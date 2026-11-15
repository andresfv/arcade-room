"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/app/components/session-provider";
import type { Game } from "@/app/data";

// Simulación visual de una partida: no hay juego real (ver spec 01).
const TICK_MS = 220;
const LEVEL_EVERY = 2500;

interface Run {
  score: number;
  lives: number;
  level: number;
}

const NEW_RUN: Run = { score: 0, lives: 3, level: 1 };

export function GamePlayer({ game }: { game: Game }) {
  const { user, saveScore } = useSession();
  const [run, setRun] = useState<Run>(NEW_RUN);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  // null = el jugador no ha editado su nombre: se usa el de la sesión (que llega tras hidratar).
  const [nameInput, setNameInput] = useState<string | null>(null);
  const name = nameInput ?? (user ? user.name : "INVITADO");

  useEffect(() => {
    if (over || paused) return;
    const t = setInterval(() => {
      setRun((r) => {
        const score = r.score + Math.floor(10 + Math.random() * 90);
        // Misma regla que la plantilla: sube de nivel al cruzar cada múltiplo de 2500.
        const level = score % LEVEL_EVERY < 100 ? r.level + 1 : r.level;
        return { ...r, score, level };
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [over, paused]);

  const restart = () => {
    setRun(NEW_RUN);
    setPaused(false);
    setOver(false);
    setSaved(false);
  };

  const onSave = () => {
    saveScore({ game: game.id, score: run.score, name });
    setSaved(true);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{run.score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v" aria-label={`${run.lives} vidas`}>
              {"♥ ".repeat(run.lives).trim() || "—"}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(run.level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" type="button" onClick={() => setPaused((p) => !p)} disabled={over}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" type="button" onClick={() => setOver(true)} disabled={over}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena" aria-hidden="true">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="av-gameover-title">
            <h2 id="av-gameover-title">FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{run.score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setNameInput(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                  aria-label="Tus iniciales"
                  autoFocus
                />
                <button className="btn yellow" type="button" onClick={onSave}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved" role="status">
                ▸ PUNTUACIÓN GUARDADA_
              </div>
            )}
            <div className="actions">
              <button className="btn" type="button" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/biblioteca" className="btn magenta">
                VOLVER A LA BIBLIOTECA
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
