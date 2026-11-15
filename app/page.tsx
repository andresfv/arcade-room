import type { Metadata } from "next";
import Link from "next/link";
import { FeatureIcon, FloatingSilhouettes, type FeatureIconKind } from "@/app/components/home-art";
import { HomeReveal } from "@/app/components/home-reveal";
import { GAMES, getGame, type Game } from "@/app/data";

// title.template del layout no aplica a la página del mismo segmento: se fija el título completo.
export const metadata: Metadata = { title: { absolute: "Arcade Room · Juega clásicos en tu navegador" } };

type Neon = Game["color"];

const FEATURES: { icon: FeatureIconKind; title: string; desc: string; color: Neon }[] = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Brick Buster, Freefall, Serpentine y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

const STATS = [
  { n: `${GAMES.length}+`, u: "JUEGOS", s: "Y CONTANDO" },
  { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA" },
  { n: "GLOBAL", u: "RANKING", s: "COMPITE CON EL MUNDO" },
];

// Actividad ficticia (sustituto de puntuaciones reales en una spec futura).
const RECENT: { player: string; gameId: string; score: number; ago: string; color: Neon }[] = [
  { player: "NEONFOX", gameId: "caida", score: 184220, ago: "hace 2 min", color: "magenta" },
  { player: "PX_KAI", gameId: "gloton", score: 96400, ago: "hace 5 min", color: "yellow" },
  { player: "Z3R0COOL", gameId: "invasores", score: 54190, ago: "hace 8 min", color: "green" },
  { player: "VAULT_07", gameId: "rocas", score: 41200, ago: "hace 12 min", color: "cyan" },
  { player: "GLITCHA", gameId: "bloque-buster", score: 28450, ago: "hace 18 min", color: "cyan" },
  { player: "ARKADYA", gameId: "serpentina", score: 7820, ago: "hace 24 min", color: "green" },
  { player: "CYBER_LU", gameId: "ranaria", score: 18900, ago: "hace 31 min", color: "yellow" },
];

const TOP_TODAY = [
  { player: "NEONFOX", score: 312840 },
  { player: "PX_KAI", score: 248110 },
  { player: "M00NRYU", score: 196720 },
  { player: "VAULT_07", score: 154300 },
  { player: "GLITCHA", score: 138900 },
];

const FAQ = [
  {
    q: "¿REALMENTE ES GRATIS?",
    a: 'Sí. Arcade Room es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
  },
  {
    q: "¿NECESITO CREAR CUENTA?",
    a: "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
  },
  {
    q: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    a: "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
  },
];

const fmt = (n: number) => n.toLocaleString("es-ES");

function SectionHead({ index, title, kickerColor }: { index: string; title: string; kickerColor: Neon }) {
  return (
    <div className="section-head">
      <div className={`kicker pixel neon-${kickerColor}`} aria-hidden="true">
        {"// " + index}
      </div>
      <h2 className="section-title">{title}</h2>
      <div className="section-rule"></div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home fade-in">
      <HomeReveal />

      {/* HERO */}
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <Link href="/biblioteca" className="btn xl pulse">
              ▶ EXPLORAR JUEGOS
            </Link>
            <Link href="/login" className="btn xl magenta">
              ✦ CREAR CUENTA
            </Link>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      {/* POR QUÉ */}
      <section className="home-section reveal">
        <SectionHead index="01" title="¿POR QUÉ ARCADE ROOM?" kickerColor="magenta" />
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={"feature-card " + f.color} style={{ transitionDelay: i * 80 + "ms" }}>
              <FeatureIcon kind={f.icon} />
              <h3 className="ft-title pixel" style={{ margin: 0 }}>
                {f.title}
              </h3>
              <p className="ft-desc" style={{ margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* JUEGOS */}
      <section className="home-section reveal">
        <SectionHead index="02" title="JUEGOS DISPONIBLES AHORA" kickerColor="cyan" />
        <div className="mini-rail">
          {GAMES.slice(0, 6).map((g) => (
            <Link key={g.id} href={`/juegos/${g.id}`} className="mini-card">
              <div className="mini-cover">
                <div className={"cover-bg " + g.cover}></div>
              </div>
              <div className="mini-meta">
                <div className="mini-title">{g.title}</div>
                <div className="mini-cat">{g.cat}</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/biblioteca" className="btn lg">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="home-stats reveal" aria-label="Estadísticas">
        <div className="stats-inner">
          {STATS.map((st, i) => (
            <div key={st.u} className="stat-block" style={{ transitionDelay: i * 90 + "ms" }}>
              <div className="stat-n neon-yellow">{st.n}</div>
              <div className="stat-u pixel">{st.u}</div>
              <div className="stat-s">{st.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVIDAD */}
      <section className="home-section reveal">
        <SectionHead index="03" title="ACTIVIDAD EN VIVO" kickerColor="yellow" />
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <h3 className="ac-title pixel" style={{ margin: 0 }}>
                ▸ ÚLTIMAS PUNTUACIONES
              </h3>
            </div>
            <div className="ticker">
              {RECENT.map((r, i) => (
                <div key={r.player + r.gameId} className="tick-row" style={{ animationDelay: i * 60 + "ms" }}>
                  <span className={"tk-p neon-" + r.color}>{r.player}</span>
                  <span className="tk-mid">▸ {getGame(r.gameId)?.title ?? r.gameId}</span>
                  <span className="tk-s">+{fmt(r.score)}</span>
                  <span className="tk-t">{r.ago}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <h3 className="ac-title pixel neon-magenta" style={{ margin: 0 }}>
                ▸ TOP JUGADORES · HOY
              </h3>
              <Link href="/salon" className="lb-link">
                VER SALÓN →
              </Link>
            </div>
            <ol className="top-list" style={{ margin: 0, listStyle: "none" }}>
              {TOP_TODAY.map((r, i) => (
                <li key={r.player} className={"top-row" + (i < 3 ? ` top${i + 1}` : "")}>
                  <span className="tp-rk">#{String(i + 1).padStart(2, "0")}</span>
                  <span className="tp-bar" aria-hidden="true">
                    <span className="tp-fill" style={{ width: 100 - i * 16 + "%" }}></span>
                  </span>
                  <span className="tp-p">{r.player}</span>
                  <span className="tp-s">{fmt(r.score)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section className="home-section reveal">
        <SectionHead index="04" title="PRECIOS" kickerColor="green" />
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <h3 className="pc-name pixel" style={{ margin: 0 }}>
              JUGADOR ARCADE
            </h3>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              <li>✔ Acceso a todos los juegos</li>
              <li>✔ Ranking global y salón de la fama</li>
              <li>✔ Sin anuncios entre partidas</li>
              <li>✔ Guarda tus puntuaciones</li>
              <li>✔ Nuevos juegos cada mes</li>
              <li>✔ Funciona en cualquier navegador</li>
            </ul>
            <Link href="/login" className="btn xl pulse" style={{ width: "100%", textAlign: "center" }}>
              EMPEZAR GRATIS →
            </Link>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel" aria-hidden="true">
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className="pricing-faq">
            {FAQ.map((f) => (
              <div key={f.q} className="faq-item">
                <h3 className="faq-q pixel" style={{ marginTop: 0 }}>
                  {f.q}
                </h3>
                <p className="faq-a" style={{ margin: 0 }}>
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="home-final reveal">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <Link href="/biblioteca" className="btn xl pulse final-cta">
          INSERTAR MONEDA →
        </Link>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </section>
    </div>
  );
}
