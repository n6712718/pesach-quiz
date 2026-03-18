'use client'

export const AVATAR_KEYS = ['חרדי', 'ברסלב', 'דתי לאומי', 'חייל', 'שוטר'] as const
export type AvatarKey = typeof AVATAR_KEYS[number]

export const AVATAR_LABELS: Record<AvatarKey, string> = {
  'חרדי': 'חרדי',
  'ברסלב': 'ברסלב',
  'דתי לאומי': 'דתי לאומי',
  'חייל': 'חייל',
  'שוטר': 'שוטר',
}

/** Deterministic avatar from email – same email always gets same avatar */
export function getAvatarFromEmail(email: string): AvatarKey {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0
  }
  return AVATAR_KEYS[Math.abs(hash) % AVATAR_KEYS.length]
}

const SKIN = '#f5deb3'

function Haredi({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#2a2a2a" />
      {/* Black coat body */}
      <path d="M16 80 C16 64 24 59 40 57 C56 59 64 64 64 80Z" fill="#111" />
      {/* White shirt collar peek */}
      <path d="M36 57 L40 61 L44 57" fill="white" />
      {/* Neck */}
      <rect x="35" y="51" width="10" height="8" fill={SKIN} />
      {/* Head */}
      <ellipse cx="40" cy="43" rx="15" ry="17" fill={SKIN} />
      {/* Large black kippah brim */}
      <ellipse cx="40" cy="29" rx="15" ry="4.5" fill="#111" />
      {/* Large black kippah dome */}
      <ellipse cx="40" cy="25" rx="13" ry="11" fill="#111" />
      {/* Peyot - right */}
      <path d="M26 42 Q22 48 24 54" stroke="#3d2b1f" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Peyot - left */}
      <path d="M54 42 Q58 48 56 54" stroke="#3d2b1f" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Beard */}
      <ellipse cx="40" cy="57" rx="12" ry="7" fill="#3d2b1f" />
      {/* Moustache */}
      <path d="M34 51 Q37 53 40 51 Q43 53 46 51" stroke="#2d1f14" strokeWidth="1.5" fill="none" />
      {/* Eyes */}
      <circle cx="35" cy="42" r="2.2" fill="#222" />
      <circle cx="45" cy="42" r="2.2" fill="#222" />
      {/* Eye shine */}
      <circle cx="36" cy="41" r="0.7" fill="white" />
      <circle cx="46" cy="41" r="0.7" fill="white" />
    </svg>
  )
}

function Breslov({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#fff8e1" />
      {/* White shirt */}
      <path d="M16 80 C16 64 24 59 40 57 C56 59 64 64 64 80Z" fill="#f5f5f5" />
      {/* Neck */}
      <rect x="35" y="51" width="10" height="8" fill={SKIN} />
      {/* Head */}
      <ellipse cx="40" cy="43" rx="15" ry="17" fill={SKIN} />
      {/* Large white kippah brim */}
      <ellipse cx="40" cy="27" rx="16" ry="5" fill="#e0e0e0" />
      {/* Large white kippah dome */}
      <ellipse cx="40" cy="22" rx="14" ry="13" fill="white" />
      <ellipse cx="40" cy="22" rx="14" ry="13" fill="none" stroke="#ddd" strokeWidth="1" />
      {/* Beard */}
      <ellipse cx="40" cy="58" rx="13" ry="8" fill="#8B6914" />
      {/* Moustache */}
      <path d="M34 51 Q37 54 40 51 Q43 54 46 51" stroke="#6b4f10" strokeWidth="1.5" fill="none" />
      {/* Eyes - happy squint */}
      <path d="M33 42 Q35 40 37 42" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M43 42 Q45 40 47 42" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Rosy cheeks */}
      <circle cx="30" cy="48" r="4" fill="#ffb3b3" opacity="0.4" />
      <circle cx="50" cy="48" r="4" fill="#ffb3b3" opacity="0.4" />
      {/* Big smile */}
      <path d="M33 50 Q40 57 47 50" stroke="#c0725a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DatiLeumi({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#e3f2fd" />
      {/* Casual blue shirt */}
      <path d="M16 80 C16 64 24 59 40 57 C56 59 64 64 64 80Z" fill="#1976d2" />
      {/* Collar */}
      <path d="M35 57 L32 52 L40 55 L48 52 L45 57Z" fill="#1565c0" />
      {/* Neck */}
      <rect x="35" y="51" width="10" height="8" fill={SKIN} />
      {/* Head */}
      <ellipse cx="40" cy="43" rx="14" ry="16" fill={SKIN} />
      {/* Small colorful knitted kippah base */}
      <ellipse cx="40" cy="31" rx="11" ry="3.5" fill="#1a237e" />
      {/* Kippah dome */}
      <ellipse cx="40" cy="28" rx="10" ry="8" fill="#283593" />
      {/* Colorful stripes on kippah */}
      <path d="M30.5 30 Q40 22 49.5 30" stroke="#f44336" strokeWidth="2" fill="none" />
      <path d="M31.5 32 Q40 25 48.5 32" stroke="#4caf50" strokeWidth="2" fill="none" />
      <path d="M33 34 Q40 28 47 34" stroke="#ff9800" strokeWidth="1.5" fill="none" />
      {/* Eyes */}
      <circle cx="35" cy="43" r="2.2" fill="#333" />
      <circle cx="45" cy="43" r="2.2" fill="#333" />
      <circle cx="36" cy="42" r="0.7" fill="white" />
      <circle cx="46" cy="42" r="0.7" fill="white" />
      {/* Friendly smile */}
      <path d="M36 50 Q40 54 44 50" stroke="#b07a5a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Soldier({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#5d7a3e" />
      {/* Olive uniform */}
      <path d="M16 80 C16 64 24 59 40 57 C56 59 64 64 64 80Z" fill="#6b8f3e" />
      {/* Epaulettes */}
      <rect x="17" y="61" width="10" height="5" rx="2" fill="#4a6628" />
      <rect x="53" y="61" width="10" height="5" rx="2" fill="#4a6628" />
      {/* Neck */}
      <rect x="35" y="51" width="10" height="8" fill={SKIN} />
      {/* Head - young, slightly slimmer */}
      <ellipse cx="40" cy="43" rx="13" ry="15" fill={SKIN} />
      {/* Olive beret - flat back side */}
      <path d="M27 30 Q40 20 56 28 L56 32 Q40 35 27 34Z" fill="#4a6628" />
      {/* Beret puff to the right */}
      <ellipse cx="52" cy="27" rx="5" ry="3.5" fill="#3d5a20" />
      {/* Small kippah just visible under beret */}
      <path d="M31 31 Q40 27 49 31" stroke="#2d4a1a" strokeWidth="2" fill="none" />
      {/* Eyes */}
      <circle cx="35" cy="43" r="2" fill="#2d4a1a" />
      <circle cx="45" cy="43" r="2" fill="#2d4a1a" />
      <circle cx="36" cy="42" r="0.6" fill="white" />
      <circle cx="46" cy="42" r="0.6" fill="white" />
      {/* Neutral mouth */}
      <path d="M36 50 Q40 53 44 50" stroke="#b07a5a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function PoliceOfficer({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <circle cx="40" cy="40" r="40" fill="#1a237e" />
      {/* Blue uniform */}
      <path d="M16 80 C16 64 24 59 40 57 C56 59 64 64 64 80Z" fill="#1565c0" />
      {/* Tie */}
      <path d="M38 57 L40 72 L42 57 L41 54 L39 54Z" fill="#0d47a1" />
      {/* Badge on chest */}
      <polygon points="40,64 37,67 38,71 40,70 42,71 43,67" fill="#ffd54f" />
      <circle cx="40" cy="68" r="1.5" fill="#f57f17" />
      {/* Neck */}
      <rect x="35" y="51" width="10" height="8" fill={SKIN} />
      {/* Head */}
      <ellipse cx="40" cy="43" rx="14" ry="15" fill={SKIN} />
      {/* Police cap brim */}
      <rect x="25" y="30" width="30" height="5" rx="2" fill="#0d1b5e" />
      {/* Cap dome */}
      <ellipse cx="40" cy="28" rx="13" ry="10" fill="#1a237e" />
      {/* Cap badge */}
      <rect x="36" y="25" width="8" height="5" rx="1.5" fill="#ffd54f" />
      <circle cx="40" cy="27.5" r="1.5" fill="#f57f17" />
      {/* Kippah under cap (just visible at edge) */}
      <path d="M28 32 Q40 28 52 32" stroke="#0d1244" strokeWidth="1.5" fill="none" />
      {/* Eyes */}
      <circle cx="35" cy="43" r="2.2" fill="#1a1a5e" />
      <circle cx="45" cy="43" r="2.2" fill="#1a1a5e" />
      <circle cx="36" cy="42" r="0.7" fill="white" />
      <circle cx="46" cy="42" r="0.7" fill="white" />
      {/* Serious mouth */}
      <path d="M36 50 L44 50" stroke="#b07a5a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function AvatarSvg({ type, size = 72 }: { type: string; size?: number }) {
  switch (type) {
    case 'חרדי':     return <Haredi size={size} />
    case 'ברסלב':    return <Breslov size={size} />
    case 'דתי לאומי': return <DatiLeumi size={size} />
    case 'חייל':     return <Soldier size={size} />
    case 'שוטר':     return <PoliceOfficer size={size} />
    default:          return <DatiLeumi size={size} />
  }
}
