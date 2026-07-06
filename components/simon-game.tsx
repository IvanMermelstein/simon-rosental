"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Trophy } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import cabeceraRosental from "@/public/logo-cabecera-rosental.png"
import { NameModal } from "./NameModal"

type Phase = "idle" | "sequence" | "input" | "roundComplete" | "gameover"

interface ColorDef {
  id: number
  name: string
  baseFrom: string
  baseTo: string
  litFrom: string
  lit: string
  glow: string
}

const COLORS: ColorDef[] = [
  { id: 0, name: "Rojo", baseFrom: "#c04545", baseTo: "#5a1010", litFrom: "#ffb3b3", lit: "#ef4444", glow: "rgba(239,68,68,0.9)" },
  { id: 1, name: "Verde", baseFrom: "#3c9e63", baseTo: "#0c3a1e", litFrom: "#a7f3d0", lit: "#22c55e", glow: "rgba(34,197,94,0.9)" },
  { id: 2, name: "Azul", baseFrom: "#4a7fc9", baseTo: "#10294d", litFrom: "#bfdbfe", lit: "#3b82f6", glow: "rgba(59,130,246,0.9)" },
  { id: 3, name: "Amarillo", baseFrom: "#cfa52e", baseTo: "#4f3f06", litFrom: "#fef08a", lit: "#eab308", glow: "rgba(234,179,8,0.9)" },
  { id: 4, name: "Violeta", baseFrom: "#9256cf", baseTo: "#2e0e4f", litFrom: "#e9d5ff", lit: "#a855f7", glow: "rgba(168,85,247,0.9)" },
  { id: 5, name: "Naranja", baseFrom: "#d97a35", baseTo: "#4f2006", litFrom: "#fed7aa", lit: "#f97316", glow: "rgba(249,115,22,0.9)" },
]

// Ángulo central de cada gajo, empezando arriba y en sentido horario
const ANGLES = COLORS.map((_, i) => -90 + i * 60)
const WEDGE_SPAN = 30 // cada gajo cubre +/-30° alrededor de su ángulo central (60° en total)
const OUTER_R = 98
const INNER_R = 32 // el hub central mide 34% (radio 34 en un viewBox de 200) — se mete 2 unidades debajo para que no quede hueco

function wedgePath(cx: number, cy: number, innerR: number, outerR: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const f = (n: number) => n.toFixed(2)
  const outerStart = { x: cx + outerR * Math.cos(toRad(startDeg)), y: cy + outerR * Math.sin(toRad(startDeg)) }
  const outerEnd = { x: cx + outerR * Math.cos(toRad(endDeg)), y: cy + outerR * Math.sin(toRad(endDeg)) }
  const innerEnd = { x: cx + innerR * Math.cos(toRad(endDeg)), y: cy + innerR * Math.sin(toRad(endDeg)) }
  const innerStart = { x: cx + innerR * Math.cos(toRad(startDeg)), y: cy + innerR * Math.sin(toRad(startDeg)) }
  return [
    `M ${f(outerStart.x)} ${f(outerStart.y)}`,
    `A ${outerR} ${outerR} 0 0 1 ${f(outerEnd.x)} ${f(outerEnd.y)}`,
    `L ${f(innerEnd.x)} ${f(innerEnd.y)}`,
    `A ${innerR} ${innerR} 0 0 0 ${f(innerStart.x)} ${f(innerStart.y)}`,
    "Z",
  ].join(" ")
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomColorId() {
  return Math.floor(Math.random() * COLORS.length)
}

function onDurationForRound(round: number) {
  return Math.max(280, 700 - (round - 1) * 30)
}

function gapDurationForRound(round: number) {
  return Math.max(150, 320 - (round - 1) * 12)
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

interface GameResult {
  rounds: number
  keysInRound: number
  time: number
}

interface ErrorFlash {
  pressed: number
  correct: number
}

export default function SimonGame() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [sequence, setSequence] = useState<number[]>([])
  const [playerIndex, setPlayerIndex] = useState(0)
  const [playbackCount, setPlaybackCount] = useState(0)
  const [litIndex, setLitIndex] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [bestRound, setBestRound] = useState(0)
  const [errorFlash, setErrorFlash] = useState<ErrorFlash | null>(null)
  const [roundFlash, setRoundFlash] = useState(false)

  const startTimeRef = useRef<number | null>(null)
  const clickLockRef = useRef(false)
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const round = sequence.length

  // Reproduce la secuencia cuando cambia (nueva ronda)
  useEffect(() => {
    if (phase !== "sequence" || sequence.length === 0) return
    let cancelled = false

    setPlaybackCount(0)
    ;(async () => {
      await sleep(600)
      for (let i = 0; i < sequence.length; i++) {
        if (cancelled) return
        setLitIndex(sequence[i])
        setPlaybackCount(i + 1)
        await sleep(onDurationForRound(sequence.length))
        if (cancelled) return
        setLitIndex(null)
        await sleep(gapDurationForRound(sequence.length))
      }
      if (!cancelled) {
        setPlayerIndex(0)
        setPhase("input")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sequence, phase])

  // Cronómetro en vivo mientras se juega
  useEffect(() => {
    if (phase === "idle" || phase === "gameover") return
    const id = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 250)
    return () => clearInterval(id)
  }, [phase])

  const startGame = () => {
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
    startTimeRef.current = Date.now()
    setElapsed(0)
    setResult(null)
    setBestRound(0)
    setShowNameModal(false)
    setErrorFlash(null)
    setRoundFlash(false)
    setPlaybackCount(0)
    setSequence([randomColorId()])
    setPlayerIndex(0)
    setPhase("sequence")
  }

  const handleColorClick = (colorId: number) => {
    if (phase !== "input" || clickLockRef.current) return

    const expected = sequence[playerIndex]

    if (colorId !== expected) {
      const finalTime = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0
      setResult({ rounds: round - 1, keysInRound: playerIndex, time: finalTime })
      setElapsed(finalTime)
      setErrorFlash({ pressed: colorId, correct: expected })
      setPhase("gameover")
      pendingTimeoutRef.current = setTimeout(() => {
        setErrorFlash(null)
        setShowNameModal(true)
      }, 1600)
      return
    }

    clickLockRef.current = true
    setLitIndex(colorId)
    setTimeout(() => {
      setLitIndex(null)
      clickLockRef.current = false
    }, 220)

    const nextIndex = playerIndex + 1
    if (nextIndex === sequence.length) {
      setBestRound(round)
      setPlayerIndex(nextIndex)
      setPhase("roundComplete")
      setRoundFlash(true)
      pendingTimeoutRef.current = setTimeout(() => {
        setRoundFlash(false)
        setSequence((prev) => [...prev, randomColorId()])
        setPhase("sequence")
      }, 800)
    } else {
      setPlayerIndex(nextIndex)
    }
  }

  const handleSaveName = async (firstName: string, lastName: string) => {
    if (!result) return
    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        rounds: result.rounds,
        keysInRound: result.keysInRound,
        time: result.time,
      }),
    })
    setShowNameModal(false)
  }

  const statusText = () => {
    if (phase === "idle") return "Presioná Iniciar para jugar"
    if (phase === "sequence") return "Prestá atención a la secuencia..."
    if (phase === "input") return "¡Tu turno! Repetí la secuencia"
    if (phase === "roundComplete") return "¡Muy bien! Sumaste una vuelta"
    if (phase === "gameover") return errorFlash ? "Ese no era... el correcto era el que brilla" : "¡Se acabó! Guardá tu puntaje"
    return ""
  }

  // Estilo del hub central según el estado del juego
  const hubClasses = errorFlash
    ? "bg-red-950/70 border-red-400/60"
    : roundFlash
      ? "bg-emerald-500/30 border-emerald-300/70"
      : phase === "sequence"
        ? "bg-blue-950/60 border-blue-300/40 animate-pulse"
        : phase === "input"
          ? "bg-emerald-950/60 border-emerald-300/50"
          : phase === "gameover"
            ? "bg-red-950/70 border-red-400/50"
            : "bg-black/40 border-white/20"

  const hubLabel = phase === "sequence" ? "MIRÁ" : phase === "input" ? "TU TURNO" : null

  const showDots = phase === "sequence" || phase === "input" || phase === "roundComplete"

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[#0B2558] to-black">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-4">
          <Image src={cabeceraRosental} alt="Rosental Inversiones" width={400} height={180} priority className="mb-6 mx-auto" />
          <p className="text-gray-100">Memorizá y repetí la secuencia de colores</p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 items-center mb-6 px-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{round > 0 ? round : "-"}</div>
            <div className="text-sm text-gray-300">Ronda</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{formatTime(elapsed)}</div>
            <div className="text-sm text-gray-300">Tiempo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{bestRound}</div>
            <div className="text-sm text-gray-300">Vueltas OK</div>
          </div>
          <Button onClick={startGame} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {phase === "idle" ? "Iniciar" : "Reiniciar"}
          </Button>
          <Link href="/ranking">
            <Button variant="outline" size="sm" className="gap-2">
              <Trophy className="w-4 h-4" />
              Ranking
            </Button>
          </Link>
        </div>

        <p className="text-center text-gray-100 mb-2 h-6">{statusText()}</p>

        {/* Progreso de la secuencia */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3 min-h-[14px] px-8">
          {showDots &&
            sequence.map((_, i) => {
              const filled =
                phase === "input" ? i < playerIndex : phase === "roundComplete" ? true : i < playbackCount
              return (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-150 ${
                    filled
                      ? phase === "sequence"
                        ? "bg-sky-300"
                        : "bg-emerald-400"
                      : "bg-white/20"
                  }`}
                />
              )
            })}
        </div>

        {/* Board */}
        <div
          className={`flex justify-center p-6 sm:p-8 bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden transition-all duration-300 mb-6 ${
            errorFlash
              ? "border-red-400/60 ring-4 ring-red-500/70"
              : roundFlash
                ? "border-emerald-300/60 ring-4 ring-emerald-400/70"
                : "border-white/20"
          }`}
        >
          <div
            className="relative aspect-square w-[min(78vw,460px)] select-none"
            style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}
          >
            {/* Disco: 6 gajos pegados formando un círculo completo, como el Simon original */}
            {/* La sombra del disco va en el div contenedor (no en el svg) para que no interfiera
                con el drop-shadow individual de cada gajo al iluminarse */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full touch-manipulation">
              <defs>
                <radialGradient id="grad-wrong" cx="100" cy="100" r="98" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="100%" stopColor="#dc2626" />
                </radialGradient>
                {COLORS.map((color) => (
                  <radialGradient
                    key={`base-${color.id}`}
                    id={`grad-base-${color.id}`}
                    cx="100"
                    cy="100"
                    r="98"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={color.baseFrom} />
                    <stop offset="100%" stopColor={color.baseTo} />
                  </radialGradient>
                ))}
                {COLORS.map((color) => (
                  <radialGradient
                    key={`lit-${color.id}`}
                    id={`grad-lit-${color.id}`}
                    cx="100"
                    cy="100"
                    r="98"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={color.litFrom} />
                    <stop offset="100%" stopColor={color.lit} />
                  </radialGradient>
                ))}
              </defs>

              {COLORS.map((color, i) => {
                const d = wedgePath(100, 100, INNER_R, OUTER_R, ANGLES[i] - WEDGE_SPAN, ANGLES[i] + WEDGE_SPAN)

                const isWrongPressed = errorFlash?.pressed === color.id
                const isCorrectHint = errorFlash?.correct === color.id && !isWrongPressed
                const isLit = litIndex === color.id || isCorrectHint
                const disabled = phase !== "input"

                const fill = isWrongPressed
                  ? "url(#grad-wrong)"
                  : isLit
                    ? `url(#grad-lit-${color.id})`
                    : `url(#grad-base-${color.id})`

                return (
                  <path
                    key={color.id}
                    d={d}
                    fill={fill}
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth={3}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={color.name}
                    aria-disabled={disabled}
                    onClick={() => handleColorClick(color.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleColorClick(color.id)
                      }
                    }}
                    className={`outline-none ${disabled ? "" : "cursor-pointer"} ${isCorrectHint ? "animate-pulse" : ""}`}
                  />
                )
              })}
            </svg>

            {/* Hub central */}
            <div
              className={`absolute rounded-full border flex flex-col items-center justify-center text-white font-bold select-none transition-colors duration-300 ${hubClasses}`}
              style={{
                width: "34%",
                height: "34%",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${roundFlash ? 1.08 : 1})`,
                transitionProperty: "background-color, border-color, transform",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              {errorFlash ? (
                <span className="text-3xl sm:text-4xl text-red-300">✗</span>
              ) : roundFlash ? (
                <span className="text-3xl sm:text-4xl text-emerald-300">✓</span>
              ) : round > 0 ? (
                <>
                  <span className="text-2xl sm:text-3xl leading-none">{round}</span>
                  {hubLabel && (
                    <span className="text-[9px] sm:text-[11px] uppercase tracking-widest opacity-80 mt-1">
                      {hubLabel}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-lg sm:text-xl">SIMON</span>
              )}
            </div>
          </div>
        </div>

        {/* Game Over summary */}
        {phase === "gameover" && result && (
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border-2 border-red-200">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Juego terminado!</h2>
            <p className="text-gray-700 mb-4">
              Completaste {result.rounds} {result.rounds === 1 ? "vuelta" : "vueltas"}, acertaste{" "}
              {result.keysInRound} {result.keysInRound === 1 ? "tecla" : "teclas"} en la vuelta {result.rounds + 1}, en{" "}
              {formatTime(result.time)}.
            </p>
            <Button onClick={startGame} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Intentar de nuevo
            </Button>
          </div>
        )}
      </div>
      <NameModal open={showNameModal} onSubmit={handleSaveName} />
    </div>
  )
}
