import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

// Configure your verified sender domain in .env.local: EMAIL_FROM
const FROM = process.env.EMAIL_FROM || 'חידון פסח – בני עקיבא עלי <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pesach-quiz.vercel.app'

function buildLotteryWinnerHtml(winner: { name: string; class: string }, date: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>זוכה הגרלת חידון פסח</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,150,.12); }
    .header { background: linear-gradient(135deg, #1e3a6e, #2d5aa0); color: #fff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; }
    .header p { margin: 8px 0 0; opacity: .8; font-size: 14px; }
    .star { font-size: 48px; display: block; margin-bottom: 8px; }
    .body { padding: 32px 24px; }
    .winner-box { background: linear-gradient(135deg, #fef9c3, #fde68a); border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }
    .winner-box .emoji { font-size: 56px; display: block; margin-bottom: 8px; }
    .winner-name { font-size: 32px; font-weight: 900; color: #92400e; }
    .winner-class { font-size: 16px; color: #b45309; margin-top: 4px; }
    .info { color: #475569; line-height: 1.8; font-size: 15px; }
    .btn { display: inline-block; background: #1e3a6e; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 16px 0; }
    .footer { background: #f8faff; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="star">✡</span>
      <h1>חידון הלכות פסח – תשפ"ו</h1>
      <p>ישיבת בני עקיבא עלי</p>
    </div>
    <div class="body">
      <p class="info">שלום לכל משתתפי החידון!</p>
      <p class="info">🎲 נערכה הגרלת ביניים ב-${date}.<br>
      מבין כל המשתתפים הפעילים – הוגרל/ה:</p>
      <div class="winner-box">
        <span class="emoji">🎉</span>
        <div class="winner-name">${winner.name}</div>
        <div class="winner-class">${winner.class}</div>
      </div>
      <p class="info">
        מזל טוב לזוכה! 🎊<br>
        ממשיכים ללמוד ולצבור נקודות לקראת ההגרלה הגדולה!
      </p>
      <div class="divider"></div>
      <center>
        <a href="${APP_URL}/leaderboard" class="btn">📊 לוח המובילים</a>
      </center>
    </div>
    <div class="footer">
      ישיבת בני עקיבא עלי • חידון הלכות פסח תשפ"ו<br>
      <a href="${APP_URL}" style="color:#94a3b8">${APP_URL}</a>
    </div>
  </div>
</body>
</html>`
}

function buildGrandLotteryHtml(
  topThree: { rank: number; name: string; class: string; total_points: number }[]
): string {
  const medals = ['🥇', '🥈', '🥉']
  const podiumRows = topThree.map((p, i) => `
    <div style="display:flex;align-items:center;gap:16px;padding:14px;background:${i===0?'#fef9c3':i===1?'#f1f5f9':'#fff7ed'};border-radius:12px;margin-bottom:8px;">
      <span style="font-size:32px">${medals[i]}</span>
      <div style="flex:1;">
        <div style="font-size:18px;font-weight:900;color:#1e3a6e">${p.name}</div>
        <div style="font-size:13px;color:#64748b">${p.class}</div>
      </div>
      <div style="font-size:20px;font-weight:900;color:#2d5aa0">${p.total_points}<span style="font-size:12px;font-weight:400;color:#94a3b8"> נק'</span></div>
    </div>`).join('')

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>סיום חידון הלכות פסח</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,150,.12); }
    .header { background: linear-gradient(135deg, #92400e, #d97706, #f59e0b); color: #fff; padding: 36px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,.3); }
    .header p { margin: 8px 0 0; opacity: .9; font-size: 14px; }
    .trophy { font-size: 56px; display: block; margin-bottom: 8px; }
    .body { padding: 32px 24px; }
    .info { color: #475569; line-height: 1.8; font-size: 15px; }
    .section-title { font-size: 18px; font-weight: 900; color: #1e3a6e; margin: 24px 0 12px; }
    .btn { display: inline-block; background: #1e3a6e; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 16px 0; }
    .footer { background: #f8faff; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="trophy">🏆</span>
      <h1>סיום חידון הלכות פסח – תשפ"ו!</h1>
      <p>ישיבת בני עקיבא עלי</p>
    </div>
    <div class="body">
      <p class="info">שלום לכם חבר'ה יקרים!</p>
      <p class="info">
        חידון הלכות פסח תשפ"ו הגיע לסיומו! 🎊<br>
        תודה לכל מי שהשתתף, למד ועשה חזק – הייתה לנו שנה נהדרת!
      </p>
      <div class="section-title">🏆 שלושת המובילים הסופיים:</div>
      ${podiumRows}
      <p class="info" style="margin-top:24px">
        מזל טוב לכל הזוכים! 🎉<br>
        ולכולם – חג פסח כשר ושמח! 🍷🫓
      </p>
      <center>
        <a href="${APP_URL}/leaderboard" class="btn">📊 לוח המובילים הסופי</a>
      </center>
    </div>
    <div class="footer">
      ישיבת בני עקיבא עלי • חידון הלכות פסח תשפ"ו<br>
      <a href="${APP_URL}" style="color:#94a3b8">${APP_URL}</a>
    </div>
  </div>
</body>
</html>`
}

export async function sendLotteryEmails(
  recipients: { email: string; name: string }[],
  winner: { name: string; class: string },
  date: string
): Promise<number> {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  const resend = getResend()
  const html = buildLotteryWinnerHtml(winner, date)
  const subject = `🎉 זוכה הגרלת חידון פסח – ${date}`

  // Resend batch: up to 100 per call
  const batchSize = 100
  let sent = 0
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    await resend.batch.send(batch.map(r => ({
      from: FROM,
      to: r.email,
      subject,
      html,
    })))
    sent += batch.length
  }
  return sent
}

export async function sendGrandLotteryEmails(
  recipients: { email: string; name: string }[],
  topThree: { rank: number; name: string; class: string; total_points: number }[]
): Promise<number> {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  const resend = getResend()
  const html = buildGrandLotteryHtml(topThree)
  const subject = '🏆 סיום חידון הלכות פסח תשפ"ו – תוצאות סופיות!'

  const batchSize = 100
  let sent = 0
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    await resend.batch.send(batch.map(r => ({
      from: FROM,
      to: r.email,
      subject,
      html,
    })))
    sent += batch.length
  }
  return sent
}
