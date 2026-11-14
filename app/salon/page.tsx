import type { Metadata } from "next";
import { HallOfFame } from "@/app/components/hall-of-fame";
import { GAMES } from "@/app/data";

export const metadata: Metadata = { title: "Salón de la Fama" };

export default function HallOfFamePage() {
  return <HallOfFame games={GAMES} />;
}
