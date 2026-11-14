import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GamePlayer } from "@/app/components/game-player";
import { RouteLoading } from "@/app/components/route-loading";
import { GAMES, getGame } from "@/app/data";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  return game ? { title: `Jugando ${game.title}` } : {};
}

// Solo la parte que lee `params` va dentro de <Suspense>, para que el App Shell sea común a todas las URLs.
export default function GamePlayerPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <GamePlayerLoader params={params} />
    </Suspense>
  );
}

async function GamePlayerLoader({ params }: Pick<PageProps<"/juegos/[id]/jugar">, "params">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) redirect("/");

  return <GamePlayer game={game} />;
}
