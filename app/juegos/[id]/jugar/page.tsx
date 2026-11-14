import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GamePlayer } from "@/app/components/game-player";
import { GAMES, getGame } from "@/app/data";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  return game ? { title: `Jugando ${game.title}` } : {};
}

export default async function GamePlayerPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) redirect("/");

  return <GamePlayer game={game} />;
}
