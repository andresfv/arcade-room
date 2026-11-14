import type { Metadata } from "next";
import { Courier_Prime, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import { Suspense } from "react";
import { Footer } from "@/app/components/footer";
import { Nav, NavShell } from "@/app/components/nav";
import { SessionProvider } from "@/app/components/session-provider";
import "./globals.css";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arcade Room · Portal Retro",
  description: "Juega online y compite por la mayor cantidad de puntos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${pressStart.variable} ${jetbrainsMono.variable} ${courierPrime.variable}`}
    >
      <body>
        <div className="av-bg" aria-hidden="true" />
        <div className="av-noise" aria-hidden="true" />
        <div id="root">
          <SessionProvider>
            {/* usePathname puede suspender en rutas con params desconocidos (cacheComponents):
                el fallback pinta la misma navbar sin enlace activo. */}
            <Suspense fallback={<NavShell pathname={null} />}>
              <Nav />
            </Suspense>
            <main className="av-main">{children}</main>
            <Footer />
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
