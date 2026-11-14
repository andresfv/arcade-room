import { HallOfFame } from "@/app/components/hall-of-fame";
import { GAMES } from "@/app/data";

export default function HallOfFamePage() {
  return <HallOfFame games={GAMES} />;
}
