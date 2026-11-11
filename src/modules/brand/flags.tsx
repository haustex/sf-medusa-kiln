/**
 * Small SVG flags for the market selector (emoji flags do not render on Windows). 4:3, drawn with a few
 * rectangles so they stay crisp at 20 px; unknown countries fall back to the code in a neutral chip.
 * Add a country: one entry in FLAGS (viewBox 0 0 24 18).
 */
const FLAGS: Record<string, React.ReactNode> = {
  us: (
    <>
      <rect width="24" height="18" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * (18 / 13)} width="24" height={18 / 13} fill="#b22234" />
      ))}
      <rect width="10" height={18 * (7 / 13)} fill="#3c3b6e" />
      {[1, 3, 5, 7].flatMap((x) => [1.2, 3.6, 6, 8.4].map((y) => <circle key={`${x}-${y}`} cx={x + 0.9} cy={y} r=".55" fill="#fff" />))}
    </>
  ),
  id: (
    <>
      <rect width="24" height="9" fill="#ce1126" />
      <rect y="9" width="24" height="9" fill="#fff" />
    </>
  ),
  gb: (
    <>
      <rect width="24" height="18" fill="#012169" />
      <path d="M0 0l24 18M24 0L0 18" stroke="#fff" strokeWidth="3.6" />
      <path d="M0 0l24 18M24 0L0 18" stroke="#c8102e" strokeWidth="1.2" />
      <path d="M12 0v18M0 9h24" stroke="#fff" strokeWidth="6" />
      <path d="M12 0v18M0 9h24" stroke="#c8102e" strokeWidth="3.6" />
    </>
  ),
  de: (
    <>
      <rect width="24" height="6" fill="#000" />
      <rect y="6" width="24" height="6" fill="#dd0000" />
      <rect y="12" width="24" height="6" fill="#ffce00" />
    </>
  ),
  fr: (
    <>
      <rect width="8" height="18" fill="#002654" />
      <rect x="8" width="8" height="18" fill="#fff" />
      <rect x="16" width="8" height="18" fill="#ce1126" />
    </>
  ),
  it: (
    <>
      <rect width="8" height="18" fill="#009246" />
      <rect x="8" width="8" height="18" fill="#fff" />
      <rect x="16" width="8" height="18" fill="#ce2b37" />
    </>
  ),
  nl: (
    <>
      <rect width="24" height="6" fill="#ae1c28" />
      <rect y="6" width="24" height="6" fill="#fff" />
      <rect y="12" width="24" height="6" fill="#21468b" />
    </>
  ),
  jp: (
    <>
      <rect width="24" height="18" fill="#fff" />
      <circle cx="12" cy="9" r="5.4" fill="#bc002d" />
    </>
  ),
  sg: (
    <>
      <rect width="24" height="9" fill="#ef3340" />
      <rect y="9" width="24" height="9" fill="#fff" />
      <circle cx="6" cy="4.5" r="2.6" fill="#fff" />
      <circle cx="7" cy="4.5" r="2.2" fill="#ef3340" />
    </>
  ),
  au: (
    <>
      <rect width="24" height="18" fill="#00008b" />
      <path d="M0 0l10 7.5M10 0L0 7.5" stroke="#fff" strokeWidth="1.5" />
      <path d="M5 0v7.5M0 3.75h10" stroke="#fff" strokeWidth="2.4" />
      <path d="M5 0v7.5M0 3.75h10" stroke="#c8102e" strokeWidth="1.2" />
      {[[18, 4], [21, 8], [17.5, 11.5], [20.5, 14.5], [5, 13]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r=".9" fill="#fff" />
      ))}
    </>
  ),
  ca: (
    <>
      <rect width="24" height="18" fill="#fff" />
      <rect width="6" height="18" fill="#d52b1e" />
      <rect x="18" width="6" height="18" fill="#d52b1e" />
      <path d="M12 3.5l1.2 2.3 1.6-.5-.5 2.2 1.9.8-1.9 1.3.4 1.7-1.9-.4-.8 2.6-.8-2.6-1.9.4.4-1.7-1.9-1.3 1.9-.8-.5-2.2 1.6.5z" fill="#d52b1e" />
    </>
  ),
}

export default function Flag({ code, className = "h-[15px] w-5" }: { code: string; className?: string }) {
  const cc = code.toLowerCase()
  const flag = FLAGS[cc]
  if (!flag) {
    return (
      <span aria-hidden="true" className={`inline-flex items-center justify-center rounded-[3px] bg-default text-[9px] font-semibold uppercase leading-none ${className}`}>
        {cc}
      </span>
    )
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 18" className={`shrink-0 rounded-[3px] ${className}`} preserveAspectRatio="xMidYMid slice">
      {flag}
      <rect width="24" height="18" fill="none" stroke="#000" strokeOpacity=".12" />
    </svg>
  )
}
