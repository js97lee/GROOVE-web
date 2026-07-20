import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type CameraState = 'idle' | 'loading' | 'active' | 'error'
type Scene = 'splash' | 'intro' | 'live' | 'result'

type AnalysisResult = {
  cocktailName: string
  cocktailConfidence: number
  moodMatch: number
  keywords: [string, string, string]
  musicCategory: 'Jazz' | 'R&B' | '고전 영화 OST'
  trackTitle: string
  trackArtist: string
  recommendationReason: string
}

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`

function GrooveLogo() {
  return (
    <img className="groove-logo" src={asset('Groove app icon.png')} alt="Groove — Feel the Groove" />
  )
}

type MascotVariant = 'coffee' | 'cocktail' | 'listen' | 'cozy'

function Mascot({
  large = false,
  variant = 'coffee',
}: {
  large?: boolean
  variant?: MascotVariant
}) {
  return (
    <img
      className={`mascot ${large ? 'large' : ''}`}
      src={asset(`character-${variant}.png`)}
      alt="GROOVE 마스코트"
    />
  )
}

function StatusBar() {
  return (
    <header className="status-bar" aria-label="상태 표시줄">
      <div className="status-left">
        <span>8:32</span>
        <span className="weather" aria-label="맑음">☀︎</span>
        <span>72°</span>
        <i />
      </div>
      <div className="battery">
        <span className="battery-icon"><i /></span>
        <strong>96%</strong>
      </div>
    </header>
  )
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const splashTimerRef = useRef<number | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [scene, setScene] = useState<Scene>('splash')
  const [errorMessage, setErrorMessage] = useState('')
  const [flash, setFlash] = useState(false)
  const [capturedImage, setCapturedImage] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState('')

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('이 브라우저에서는 카메라를 사용할 수 없어요.')
      setCameraState('error')
      return
    }

    setCameraState('loading')
    setErrorMessage('')
    stopCamera()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraState('active')
      setScene('splash')
      splashTimerRef.current = window.setTimeout(() => setScene('intro'), 1800)
    } catch (error) {
      const denied =
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      setErrorMessage(
        denied
          ? '카메라 권한을 허용해 주세요.'
          : '카메라를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
      setCameraState('error')
    }
  }, [stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
      if (splashTimerRef.current) window.clearTimeout(splashTimerRef.current)
    }
  }, [stopCamera])

  const captureAndAnalyze = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      setAnalysisError('카메라 화면이 준비되지 않았어요. 다시 시도해 주세요.')
      return
    }

    const canvas = document.createElement('canvas')
    const maxWidth = 1280
    const scale = Math.min(1, maxWidth / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const image = canvas.toDataURL('image/jpeg', 0.82)
    setCapturedImage(image)
    setAnalysis(null)
    setAnalysisError('')
    setFlash(true)
    window.setTimeout(() => setFlash(false), 420)
    window.setTimeout(() => setScene('live'), 180)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error('AI 분석 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '분석에 실패했습니다.')
      setAnalysis(data as AnalysisResult)
      setScene('result')
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : '분석에 실패했습니다.')
    }
  }

  return (
    <main className="page">
      <section className={`xr-frame scene-${scene}`}>
        <video
          ref={videoRef}
          className="camera-feed"
          muted
          playsInline
          aria-label="실시간 카메라 화면"
        />
        {capturedImage && scene !== 'intro' && scene !== 'splash' && (
          <img className="captured-frame" src={capturedImage} alt="촬영된 칵테일" />
        )}
        <div className="camera-placeholder" aria-hidden="true" />
        <div className="camera-filter" aria-hidden="true" />

        <StatusBar />

        {cameraState === 'active' && scene === 'splash' && (
          <div className="scene splash-scene">
            <GrooveLogo />
            <h1>FILL THE GROOVE</h1>
          </div>
        )}

        {cameraState === 'active' && scene === 'intro' && (
          <div className="scene intro-scene">
            <h1>오늘의 감성을 한 컷 담아보세요</h1>
            <Mascot large />
            <button className="shoot-button" type="button" onClick={captureAndAnalyze}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7.5 7 9 4.8h6L16.5 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              눌러서 촬영
            </button>
          </div>
        )}

        {cameraState === 'active' && scene === 'live' && (
          <div className="scene live-scene">
            <div className="live-mascot">
              <Mascot variant={analysisError ? 'coffee' : 'cozy'} />
            </div>
            {analysisError ? (
              <div className="analysis-error">
                <p>{analysisError}</p>
                <button type="button" onClick={() => setScene('intro')}>다시 촬영</button>
              </div>
            ) : (
              <p><strong>GROOVE가 분석 중이에요</strong><br />칵테일과 어울리는 무드를 찾고 있어요…</p>
            )}
          </div>
        )}

        {cameraState === 'active' && scene === 'result' && analysis && (
          <div className="scene result-scene">
            <h1>무드매치 결과가 나왔어요!</h1>
            <div className="result-content">
              <div className="result-mascot">
                <Mascot large variant="cocktail" />
              </div>
              <article className="mood-card">
                <div className="vinyl-player" aria-hidden="true">
                  <img className="vinyl" src={asset('CD-play.png')} alt="" />
                  <Mascot variant="listen" />
                </div>
                <div className="cocktail-name">
                  <span>{analysis.cocktailName}</span>
                  <small>칵테일 신뢰도 {analysis.cocktailConfidence}%</small>
                </div>
                <h2>{analysis.musicCategory} MOOD MATCH</h2>
                <strong>{analysis.moodMatch}%</strong>
                <div className="mood-tags">
                  {analysis.keywords.map((keyword) => (
                    <span key={keyword}>#{keyword.replace(/^#/, '')}</span>
                  ))}
                </div>
                <div className="track-recommendation">
                  <b>{analysis.trackTitle}</b>
                  <span>{analysis.trackArtist}</span>
                  <p>{analysis.recommendationReason}</p>
                  <a
                    className="listen-button"
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${analysis.trackTitle} ${analysis.trackArtist}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m10 8 6 4-6 4V8Z" />
                    </svg>
                    노래 듣기
                  </a>
                </div>
              </article>
            </div>

            <nav className="tool-rail" aria-label="결과 도구">
              <button type="button" aria-label="음악">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 18V6l10-2v12M9 10l10-2" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="16" cy="16" r="3" />
                </svg>
              </button>
              <button type="button" aria-label="위치">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                  <circle cx="12" cy="10" r="2" />
                </svg>
              </button>
              <button type="button" aria-label="저장">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 4h12v17l-6-4-6 4V4Z" />
                </svg>
              </button>
              <button type="button" aria-label="공유">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 15V3M8 7l4-4 4 4M6 11H4v9h16v-9h-2" />
                </svg>
              </button>
            </nav>
          </div>
        )}

        {cameraState !== 'active' && (
          <div className="camera-gate">
            <GrooveLogo />
            <h1>FILL THE GROOVE</h1>
            <p>{errorMessage || '카메라 위에서 오늘의 감성을 기록해 보세요.'}</p>
            <button type="button" onClick={startCamera} disabled={cameraState === 'loading'}>
              {cameraState === 'loading' ? '카메라 연결 중…' : cameraState === 'error' ? '다시 시도' : '카메라 시작'}
            </button>
            {!window.isSecureContext && <small>카메라 사용을 위해 HTTPS 연결이 필요합니다.</small>}
          </div>
        )}

        <div className={`flash ${flash ? 'visible' : ''}`} aria-hidden="true" />
      </section>
    </main>
  )
}

export default App
