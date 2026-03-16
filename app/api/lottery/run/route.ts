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

  if (type === 'regular') {
    // Pool: everyone who completed at least one quiz
    const pool = participants.filter(p => p.last_quiz_day > 0)
    if (pool.length === 0) {
      return NextResponse.json({ error: 'No eligible participants' }, { status: 400 })
    }
    winner = pool[Math.floor(Math.random() * pool.length)]
  } else {
    // Grand: weighted by points (every 10 pts = 1 ticket)
    const pool: typeof participants = []
    participants.filter(p => p.total_points > 0).forEach(p => {
      const tickets = Math.max(1, Math.floor(p.total_points / 10))
      for (let t = 0; t < tickets; t++) pool.push(p)
    })
    if (pool.length === 0) {
      return NextResponse.json({ error: 'No eligible participants' }, { status: 400 })
    }
    winner = pool[Math.floor(Math.random() * pool.length)]
  }

  const date = new Date().toLocaleDateString('he-IL')
  const description = type === 'grand'
    ? `הגרלה גדולה – סיום החידון – ${date}`
    : `הגרלה כל 3 ימים – ${date}`

  // Save lottery to DB
  const { data: savedLottery, error: lErr } = await supabase
    .from('lotteries')
    .insert({
      type,
      winner_id: winner.id,
      winner_name: winner.name,
      winner_class: winner.class,
      description,
    })
    .select()
    .single()

  if (lErr) {
    return NextResponse.json({ error: 'Failed to save lottery' }, { status: 500 })
  }

  // Send emails
  if (sendEmails) {
    const recipients = participants.filter(p => p.email).map(p => ({ email: p.email, name: p.name }))
    try {
      if (type === 'regular') {
        emailsSent = await sendLotteryEmails(recipients, winner, date)
      } else {
        // Grand lottery: get top 3 from leaderboard
        const { data: top } = await supabase
          .from('participants')
          .select('name, class, total_points')
          .order('total_points', { ascending: false })
          .limit(3)

        const topThree = (top || []).map((p, i) => ({ rank: i + 1, ...p }))
        emailsSent = await sendGrandLotteryEmails(recipients, topThree)
      }
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr)
      // Don't fail the whole request — lottery was saved
    }
  }

  return NextResponse.json({
    success: true,
    lottery: savedLottery,
    winner: { name: winner.name, class: winner.class },
    emailsSent,
  })
}
