"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useHydrated, useSession } from "@/app/components/session-provider";

type Section = "inicio" | "biblioteca" | "salon" | "acerca" | "auth";

function sectionFor(pathname: string | null): Section | null {
  if (!pathname) return null;
  if (pathname === "/") return "inicio";
  // La Biblioteca sigue activa dentro de Detalle y Reproductor (/juegos/*).
  if (pathname.startsWith("/biblioteca") || pathname.startsWith("/juegos")) return "biblioteca";
  if (pathname.startsWith("/salon")) return "salon";
  if (pathname.startsWith("/acerca")) return "acerca";
  if (pathname.startsWith("/login")) return "auth";
  return null;
}

/**
 * Navbar + panel móvil. Recibe la ruta ya resuelta para poder renderizarse
 * también como fallback de <Suspense> (sin ruta activa) mientras se resuelve usePathname.
 */
export function NavShell({ pathname }: { pathname: string | null }) {
  const { user, logout } = useSession();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const active = sectionFor(pathname);
  const cls = (s: Section) => (active === s ? "active" : undefined);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav className="av-nav" aria-label="Principal">
        <Link href="/" className="logo" onClick={close} aria-label="Arcade Room, ir al inicio">
          <div className="logo-mark" aria-hidden="true"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">ROOM</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={cls("inicio")} aria-current={active === "inicio" ? "page" : undefined}>
            Inicio
          </Link>
          <Link href="/biblioteca" className={cls("biblioteca")} aria-current={active === "biblioteca" ? "page" : undefined}>
            Biblioteca
          </Link>
          <Link href="/salon" className={cls("salon")} aria-current={active === "salon" ? "page" : undefined}>
            Salón de la Fama
          </Link>
          <Link href="/acerca" className={cls("acerca")} aria-current={active === "acerca" ? "page" : undefined}>
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin" aria-hidden="true"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {!hydrated ? (
          // Aún no se sabe si hay sesión: reserva el hueco sin mostrar "Iniciar Sesión".
          <span className="btn auth-btn" aria-hidden="true" style={{ visibility: "hidden" }}>
            Iniciar Sesión
          </span>
        ) : user ? (
          <button className="btn ghost auth-btn" type="button" onClick={logout} title="Cerrar sesión">
            {user.name} ▾
          </button>
        ) : (
          <Link href="/login" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button
          className="btn ghost hamburger"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menú"
          aria-expanded={open}
          aria-controls="av-mobile-panel"
        >
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close} aria-hidden="true"></div>
      <aside id="av-mobile-panel" className={"av-mobile-panel" + (open ? " open" : "")} inert={!open}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link href="/" className={cls("inicio")} onClick={close}>
          Inicio
        </Link>
        <Link href="/biblioteca" className={cls("biblioteca")} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={cls("salon")} onClick={close}>
          Salón de la Fama
        </Link>
        <Link href="/acerca" className={cls("acerca")} onClick={close}>
          Acerca de
        </Link>
        <Link href="/login" className={cls("auth")} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}

export function Nav() {
  const pathname = usePathname();
  return <NavShell pathname={pathname} />;
}
