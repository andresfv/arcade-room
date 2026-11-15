import type { Metadata } from "next";
import { LibraryBrowser } from "@/app/components/library-browser";
import { CATS, GAMES } from "@/app/data";

export const metadata: Metadata = { title: "Biblioteca" };

export default function LibraryPage() {
  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE ROOM</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <LibraryBrowser games={GAMES} cats={CATS} />
    </div>
  );
}
