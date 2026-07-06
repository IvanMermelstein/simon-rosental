'use client'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Score {
  firstName: string
  lastName: string
  rounds: number
  keysInRound: number
  time: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function RankingSkeleton() {
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#0B2558] to-black text-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl text-white mb-6 text-center mt-8">Ranking</h1>
        <div className="grid grid-cols-5 gap-4 font-bold pb-2 border-b border-gray-300">
          <div>Pos.</div><div>Nombre</div><div>Vueltas</div><div>Teclas</div><div>Tiempo</div>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`${i % 2 === 0 ? 'bg-white/10' : ''} grid grid-cols-5 gap-4 py-2`}>
            <div className="h-5 w-6 bg-gray-600 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-600 rounded animate-pulse" />
            <div className="h-5 w-8 bg-gray-600 rounded animate-pulse" />
            <div className="h-5 w-8 bg-gray-600 rounded animate-pulse" />
            <div className="h-5 w-12 bg-gray-600 rounded animate-pulse" />
          </div>
        ))}
        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="outline" className='text-gray-900'>Volver al juego</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RankingPage() {
  const { data, error } = useSWR<Score[]>('/api/scores', fetcher)

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-[#0B2558] to-black text-white flex flex-col items-center justify-center gap-4">
        <p>No se pudo cargar el ranking. Probá de nuevo más tarde.</p>
        <Link href="/">
          <Button variant="outline" className="text-gray-900">Volver al juego</Button>
        </Link>
      </div>
    )
  }
  if (!data) return <RankingSkeleton />

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#0B2558] to-black text-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl text-white mb-6 text-center mt-8">Ranking</h1>
        <div className="grid grid-cols-5 gap-4 font-bold pb-2 border-b border-gray-300">
          <div>Pos.</div><div>Nombre</div><div>Vueltas</div><div>Teclas</div><div>Tiempo</div>
        </div>
        {data.slice(0, 20).map((s, i) => (
          <div key={i} className={`${i % 2 === 0 ? 'bg-white/10' : ''} grid grid-cols-5 gap-4 py-2`}>
            <div>{i + 1}</div>
            <div>{s.firstName} {s.lastName}</div>
            <div>{s.rounds}</div>
            <div>{s.keysInRound}</div>
            <div>{formatTime(s.time)}</div>
          </div>
        ))}
        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="outline" className='text-gray-900'>Volver al juego</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
