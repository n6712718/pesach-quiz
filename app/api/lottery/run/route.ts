import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLotteryEmails, sendGrandLotteryEmails } from '@/lib/email'

// Server-side Supabase client (service role for unrestricted reads)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Use service role key if available, fall back to anon
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

function verifyAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const type: 'regular' | 'grand' = body.type === 'grand' ? 'grand' : 'regular'
  const sendEmails: boolean = body.sendEmails !== false // default true

  const supabase = getSupabase()

  // Fetch all participants
  const { data: participants, error: pErr } = await supabase
    .from('participants')
    .select('id, name, class, email, total_points, last_quiz_day')
  if (pErr || !participants) {
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }

  let winner: { id: string; name: string; class: string } | null = null
  let emailsSent = 0
  const date = new Date().toLocaleDateString('he-IL')

  if (type === 'regular') {
    // Pool: everyone who completed at least one quiz
    const pool = participants.filter(p => p.last_quiz_day > 0)
    if (pool.length === 0) {
      return NextResponse.json({ error: 'No eligible participants' }, { status: 400 })
    }
    winner = pool[Math.floor(Math.random() * pool.length)]

    const { data: savedLottery, error: lErr } = await supabase
      .from('lotteries')
      .insert({
        type,
        winner_id: winner.id,
        winner_name: winner.name,
        winner_class: winner.class,
        description: `הגרלת ביניים – ${date}`,
      })
      .select()
      .single()

    if (lErr) return NextResponse.json({ error: 'Failed to save lottery' }, { status: 500 })

    if (sendEmails) {
      const recipients = participants.filter(p => p.email).map(p => ({ email: p.email, name: p.name }))
      try { emailsSent = await sendLotteryEmails(recipients, winner, date) }
      catch (e) { console.error('Email sending failed:', e) }
    }

    return NextResponse.json({ success: true, lottery: savedLottery, winner: { name: winner.name, class: winner.class }, emailsSent })

  } else {
    // Grand: top 3 by total points
    const PRIZES = [
      'מקום ראשון – אוהל ל-4 אנשים',
      'מקום שני – פקל קפל מקצועי',
      'מקום שלישי – שובר להמבורגר',
    ]
    const top3 = participants
      .filter(p => p.total_points > 0)
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 3)

    if (top3.length === 0) {
      return NextResponse.json({ error: 'No eligible participants' }, { status: 400 })
    }

    for (let i = 0; i < top3.length; i++) {
      await supabase.from('lotteries').insert({
        type: 'grand',
        winner_id: top3[i].id,
        winner_name: top3[i].name,
        winner_class: top3[i].class,
        description: `${PRIZES[i]} – ${date}`,
      })
    }

    winner = top3[0]

    if (sendEmails) {
      const recipients = participants.filter(p => p.email).map(p => ({ email: p.email, name: p.name }))
      try {
        const topThree = top3.map((p, i) => ({ rank: i + 1, name: p.name, class: p.class, total_points: p.total_points }))
        emailsSent = await sendGrandLotteryEmails(recipients, topThree)
      } catch (e) { console.error('Email sending failed:', e) }
    }

    return NextResponse.json({
      success: true,
      winners: top3.map((p, i) => ({ rank: i + 1, name: p.name, class: p.class, prize: PRIZES[i] })),
      winner: { name: winner.name, class: winner.class },
      emailsSent,
    })
  }
}
