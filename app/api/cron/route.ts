import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron calls this endpoint daily at 08:00 Israel time (UTC+2/+3)
// Schedule in vercel.json: "0 6 * * *" (06:00 UTC = 08:00 IST in summer)

const START_DATE = new Date(process.env.NEXT_PUBLIC_START_DATE || '2025-04-01')
START_DATE.setHours(0, 0, 0, 0)

// Grand lottery date: 31 March 2026
const GRAND_DATE = new Date('2026-03-31')
GRAND_DATE.setHours(0, 0, 0, 0)

function todayIsGrandLotteryDay(): boolean {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t.getTime() === GRAND_DATE.getTime()
}

function todayIsRegularLotteryDay(): boolean {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((t.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24))
  // Every 3 days starting from day 3 (days 3, 6, 9, ...)
  return diffDays > 0 && diffDays % 3 === 0
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends Authorization: Bearer {CRON_SECRET}
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isGrand = todayIsGrandLotteryDay()
  const isRegular = !isGrand && todayIsRegularLotteryDay()

  if (!isGrand && !isRegular) {
    return NextResponse.json({ message: 'No lottery today', date: new Date().toISOString() })
  }

  // Call the lottery run API internally
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`
  const secret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD

  const res = await fetch(`${baseUrl}/api/lottery/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
    },
    body: JSON.stringify({
      type: isGrand ? 'grand' : 'regular',
      sendEmails: true,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('Cron lottery failed:', data)
    return NextResponse.json({ error: data.error }, { status: 500 })
  }

  console.log(`Cron lottery (${isGrand ? 'grand' : 'regular'}) completed:`, data)
  return NextResponse.json({
    ran: true,
    type: isGrand ? 'grand' : 'regular',
    winner: data.winner,
    emailsSent: data.emailsSent,
  })
}
