import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

const asset = (name: string) =>
  `${import.meta.env.BASE_URL}assets/${name.split('/').map(encodeURIComponent).join('/')}`

type IconName = 'scan' | 'music' | 'pin' | 'bookmark' | 'share' | 'spark' | 'users' | 'heart' | 'play'

const icons: Record<IconName, React.ReactNode> = {
  scan: <><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4M16 21h4a1 1 0 0 0 1-1v-4"/><circle cx="12" cy="12" r="3"/></>,
  music: <><path d="M9 18V6l10-2v12M9 10l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z"/>,
  share: <><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></>,
  spark: <path d="m12 2 1.5 5.3L19 9l-5.5 1.7L12 16l-1.5-5.3L5 9l5.5-1.7L12 2ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
  play: <path d="m9 7 9 5-9 5V7Z"/>,
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{icons[name]}</svg>
}

const moments = [
  { title: 'Gin Tonic', place: 'Somewhere Bar', time: '08.20 22:31', mood: 87, tint: 'gold' },
  { title: 'Negroni', place: 'Union Bar', time: '08.18 21:07', mood: 82, tint: 'rose' },
  { title: 'Margarita', place: 'Le Chamber', time: '08.15 20:45', mood: 91, tint: 'lime' },
  { title: 'Highball', place: 'Archive Seongsu', time: '08.12 19:53', mood: 76, tint: 'amber' },
]

const steps = [
  ['scan', '칵테일 인식 & 무드 분석', 'XR 글래스가 칵테일의 컬러와 분위기를 실시간으로 인식해요.'],
  ['music', '음악 추천', 'AI가 무드에 어울리는 음악을 골라 바로 재생해요.'],
  ['pin', '장소 & 순간 기록', '장소, 시간, 날씨까지 자동으로 기억해요.'],
  ['bookmark', '나만의 Groove 저장', '모든 경험이 하나의 컬렉션으로 쌓여요.'],
  ['share', '공유 & 발견', '친구와 공유하고 새로운 Groove를 발견해요.'],
] as const

function GlassDemo() {
  const [scanning, setScanning] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!scanning) return
    const timer = window.setTimeout(() => setScanning(false), 2100)
    return () => window.clearTimeout(timer)
  }, [scanning])

  return (
    <div className="glasses-shell" aria-label="GROOVE 스마트 글래스 인터페이스 데모">
      <div className="bridge" />
      <div className="lens lens-left">
        <div className="lens-glow" />
        <div className="scan-label"><span /> {scanning ? 'ANALYZING...' : 'SCANNING...'}</div>
        <div className={`focus-frame ${scanning ? 'is-scanning' : ''}`}>
          <div className="cocktail">
            <i className="lime lime-one" /><i className="lime lime-two" />
            <span className="glass-rim" /><span className="glass-body" /><span className="glass-stem" />
          </div>
        </div>
        <div className="drink-copy"><b>Gin Tonic</b><small>Citrus · Fresh · Clean</small></div>
        <div className="match-copy"><small>MOOD MATCH</small><strong>{scanning ? '…' : '87%'}</strong><span>#상쾌한 &nbsp; #시티팝 &nbsp; #나이트뷰</span></div>
        <button className="scan-button" onClick={() => setScanning(true)} disabled={scanning}>
          <Icon name="scan" size={16} /> {scanning ? '분석 중' : '다시 스캔'}
        </button>
      </div>
      <div className="lens lens-right">
        <div className="record-orbit">
          <img src={asset('CD-Play.png')} alt="" className={playing ? 'spinning' : ''} />
        </div>
        <img className="lens-mascot" src={asset('character-listen.png')} alt="음악을 듣는 Groovy" />
        <div className="mini-tools">
          <button aria-label="음악"><Icon name="music" size={16} /></button>
          <button aria-label="위치"><Icon name="pin" size={16} /></button>
          <button className={saved ? 'active' : ''} onClick={() => setSaved(!saved)} aria-label="저장"><Icon name="bookmark" size={16} /></button>
        </div>
        <div className="now-playing">
          <small>NIGHT RIDE</small><b>Tom Misch</b>
          <div className="player-row">
            <button onClick={() => setPlaying(!playing)} aria-label={playing ? '일시정지' : '재생'}>{playing ? 'Ⅱ' : '▶'}</button>
            <div className={`wave ${playing ? 'active' : ''}`}>{Array.from({ length: 15 }, (_, i) => <i key={i} />)}</div>
            <span>02:43</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Landing() {
  const [activeMoment, setActiveMoment] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="landing-page">
      <nav className="top-nav">
        <a className="brand" href="#top" aria-label="GROOVE 홈">
          <img className="brand-logo" src={asset('groove-logo.png')} alt="Groove — Feel the Groove" />
        </a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="메뉴 열기">☰</button>
        <div className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#collection" onClick={() => setMenuOpen(false)}>Collection</a>
          <a className="nav-cta" href="/" onClick={() => setMenuOpen(false)}>Try GROOVE <span>↗</span></a>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-noise" />
        <div className="hero-copy">
          <span className="eyebrow"><i /> XR MUSIC EXPERIENCE</span>
          <h1>한 잔의 분위기가<br /><em>음악이 되는 순간</em></h1>
          <p>GROOVE는 스마트 글래스로 눈앞의 칵테일과 공간을 읽고,<br />지금 이 순간에 가장 어울리는 음악을 들려줍니다.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/">경험 시작하기 <span>→</span></Link>
          </div>
          <div className="trust-row">
            <span><b>AI</b> 실시간 무드 분석</span><span><b>XR</b> 핸즈프리 경험</span><span><b>∞</b> 순간 아카이빙</span>
          </div>
        </div>
        <div className="hero-visual" id="demo">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <GlassDemo />
          <span className="float-tag tag-one"><Icon name="spark" size={14} /> MOOD 87%</span>
          <span className="float-tag tag-two"><Icon name="music" size={14} /> NOW PLAYING</span>
        </div>
      </header>

      <section className="media-section" id="showcase" aria-label="GROOVE 체험 영상">
        <video
          className="media-video"
          src={asset('groove-showcase.mp4')}
          poster={asset('showcase.jpg')}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </section>

      <section className="intro-band" id="experience">
        <div className="section-kicker">BEYOND WHAT YOU SEE</div>
        <h2>보이는 것 너머의 감각을<br /><em>음악으로 연결합니다.</em></h2>
        <p>라테일 인식 & 무드 분석부터 음악 추천, 장소 기록, 친구와의 공유까지.<br />GROOVE는 평범한 밤을 오래 기억될 감각적인 경험으로 바꿉니다.</p>
        <div className="feature-cards">
          <article><span>01</span><Icon name="scan" size={28} /><h3>칵테일 인식</h3><p>컬러, 재료, 분위기를<br />실시간으로 읽어요.</p></article>
          <article><span>02</span><Icon name="spark" size={28} /><h3>AI 무드 매칭</h3><p>공간의 온도와 취향을<br />하나의 무드로 분석해요.</p></article>
          <article><span>03</span><Icon name="music" size={28} /><h3>음악 큐레이션</h3><p>그 순간을 완성하는<br />단 한 곡을 추천해요.</p></article>
          <article><span>04</span><Icon name="users" size={28} /><h3>함께하는 발견</h3><p>친구의 Groove에서<br />새로운 취향을 만나요.</p></article>
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="how-heading">
          <span className="section-kicker">HOW IT WORKS</span>
          <h2>바라보는 것만으로<br />당신의 Groove가 시작돼요.</h2>
        </div>
        <div className="steps">
          {steps.map(([icon, title, copy], index) => (
            <article key={title}>
              <div className="step-icon"><Icon name={icon} size={22} /><span>0{index + 1}</span></div>
              <h3>{title}</h3><p>{copy}</p>
              {index < steps.length - 1 && <i className="step-line" />}
            </article>
          ))}
        </div>
      </section>

      <section className="collection-section" id="collection">
        <div className="collection-copy">
          <span className="section-kicker">MY GROOVE COLLECTION</span>
          <h2>당신이 사랑한 밤은<br />하나의 플레이리스트가 됩니다.</h2>
          <p>장소와 시간, 음악과 기분까지 함께 저장되는<br />나만의 감각 아카이브를 만들어보세요.</p>
          <div className="collection-stats"><span><b>24</b> GROOVES</span><span><b>18</b> PLACES</span><span><b>7</b> FRIENDS</span></div>
        </div>
        <div className="moment-browser">
          <div className={`moment-focus ${moments[activeMoment].tint}`}>
            <div className="focus-top"><span>{moments[activeMoment].place}</span><Icon name="bookmark" size={18} /></div>
            <div className="mini-cocktail"><i /><i /></div>
            <div className="focus-bottom">
              <span>MOOD MATCH</span><strong>{moments[activeMoment].mood}%</strong>
              <h3>{moments[activeMoment].title}</h3><small>{moments[activeMoment].time}</small>
            </div>
          </div>
          <div className="moment-list">
            {moments.map((moment, index) => (
              <button className={activeMoment === index ? 'active' : ''} onClick={() => setActiveMoment(index)} key={moment.title}>
                <span className={`moment-thumb ${moment.tint}`}><i /></span>
                <span><b>{moment.title}</b><small>{moment.place}</small></span>
                <em>{moment.mood}%</em>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="share-section">
        <img src={asset('character-cocktail.png')} alt="칵테일을 든 GROOVE 마스코트 Groovy" />
        <div><span className="section-kicker">SHARE THE GROOVE</span><h2>좋은 순간은<br />함께할수록 더 선명해지니까.</h2></div>
        <div className="share-bubbles"><span>#NightRide</span><span>#GinTonic</span><span>#Seongsu</span></div>
        <Link to="/" className="primary-button">나의 Groove 시작하기 <span>↗</span></Link>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top" aria-label="GROOVE 홈">
          <img className="brand-logo" src={asset('groove-logo.png')} alt="Groove — Feel the Groove" />
        </a>
        <p>AI가 읽고, 음악이 기억하는 당신의 순간.</p>
        <div><a href="#experience">Experience</a><a href="#how">How it works</a><a href="#collection">Collection</a></div>
        <small>© 2026 GROOVE XR. All rights reserved.</small>
      </footer>
    </main>
  )
}

export default Landing
