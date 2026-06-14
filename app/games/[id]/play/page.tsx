import { notFound } from 'next/navigation'
import { GAMES } from '@/lib/data'
import GamePlayer from './GamePlayer'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlayPage({ params }: Props) {
  const { id } = await params
  const game = GAMES.find((g) => g.id === id)
  if (!game) notFound()
  return <GamePlayer game={game} />
}
