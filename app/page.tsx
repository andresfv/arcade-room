import type { Metadata } from "next";
import { LibraryBrowser } from "@/app/components/library-browser";
import { CATS, GAMES } from "@/app/data";

// title.template del layout no aplica a la página del mismo segmento: se fija el título completo.
export const metadata: Metadata = { title: { absolute: "Biblioteca · Arcade Room" } };

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
