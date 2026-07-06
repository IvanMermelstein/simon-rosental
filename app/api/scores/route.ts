export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!
const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!
const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, '\n')

async function initDoc() {
  const jwt = new JWT({ email, key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt)
  await doc.loadInfo()
  return doc.sheetsByIndex[0]
}

export async function POST(req: Request) {
  const { firstName, lastName, rounds, keysInRound, time } = await req.json()
  if (!firstName || !lastName || rounds == null || keysInRound == null || time == null)
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const sheet = await initDoc()
  await sheet.addRow({ firstName, lastName, rounds, keysInRound, time, createdAt: new Date().toISOString() })
  return NextResponse.json({ success: true }, { status: 201 })
}

export async function GET() {
  const sheet = await initDoc()
  const rows = await sheet.getRows()
  const headers = sheet.headerValues
  const scores = rows.map(row => {
    const rec: Record<string, string> = {}
    headers.forEach((h, idx) => {
      rec[h] = row._rawData[idx]
    })
    return {
      firstName: rec.firstName,
      lastName: rec.lastName,
      rounds: Number(rec.rounds),
      keysInRound: Number(rec.keysInRound),
      time: Number(rec.time),
      createdAt: rec.createdAt
    }
  })

  // Deduplicar filas completas (mismo nombre, apellido, vueltas, teclas y tiempo)
  const uniqueScores = Array.from(
    new Map(
      scores.map(s => [
        `${s.firstName}|${s.lastName}|${s.rounds}|${s.keysInRound}|${s.time}`,
        s
      ])
    ).values()
  )

  // Ranking: más vueltas acertadas > más teclas acertadas dentro de la vuelta > menor tiempo
  uniqueScores.sort((a, b) => b.rounds - a.rounds || b.keysInRound - a.keysInRound || a.time - b.time)
  return NextResponse.json(uniqueScores)
}
