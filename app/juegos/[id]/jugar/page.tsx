import { redirect } from "next/navigation";
import { GamePlayer } from "@/app/components/game-player";
import { GAMES, getGame } from "@/app/data";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default async function GamePlayerPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) redirect("/");

  return <GamePlayer game={game} />;
}
