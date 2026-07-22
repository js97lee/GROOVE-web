import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  pickCatalogTrack,
  youtubeEmbedSrc,
  youtubeWatchUrl,
  type CatalogTrack,
  type MusicCategory,
} from './musicCatalog'
import './Experience.css'

type CameraState = 'idle' | 'loading' | 'active' | 'error'
type Scene =
  | 'splash'
  | 'intro'
  | 'countdown'
  | 'matching'
  | 'result'
  | 'music'
  | 'player'
  | 'share'
  | 'gallery'
type MascotVariant = 'coffee' | 'cocktail' | 'listen' | 'cozy'

type AnalysisResult = {
  cocktailName: string
  cocktailConfidence: number
  moodMatch: number
  keywords: [string, string, string]
  musicCategory: MusicCategory
  trackTitle: string
  trackArtist: string
  recommendationReason: string
}

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`
const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

const musicScenes: Scene[] = ['result', 'music', 'player', 'share', 'gallery']

function GrooveMusic({
  track,
  muted,
  active,
}: {
  track: CatalogTrack | null
  muted: boolean
  active: boolean
}) {
  if (!track || !active) return null

  return (
    <iframe
      key={`${track.videoId}-${muted ? 'mute' : 'sound'}`}
      className="groove-music-frame"
      title={`${track.title} — ${track.artist}`}
      src={youtubeEmbedSrc(track.videoId, muted)}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      tabIndex={-1}
    />
  )
}

function GrooveLogo() {
  return (
    <img
      className="groove-logo"
      src={asset('Groove app icon.png')}
      alt="Groove — Feel the Groove"
    />
  )
}

function SpriteMascot({
  variant = 'coffee',
  size = 'regular',
}: {
  variant?: MascotVariant
  size?: 'regular' | 'large' | 'small'
}) {
  return (
    <span
      className={`sprite-mascot sprite-${variant} sprite-${size}`}
      role="img"
      aria-label="GROOVE 마스코트"
    >
      <img src={asset(`sprites/${variant}-sprite.png`)} alt="" />
    </span>
  )
}

function StatusBar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const currentTime = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  return (
    <header className="status-bar" aria-label="상태 표시줄">
      <div className="status-left">
        <span>{currentTime}</span>
        <span className="weather" aria-label="맑음">☀︎</span>
        <span>22°C</span>
        <i />
      </div>
      <div className="battery">
        <span className="battery-icon"><i /></span>
        <strong>96%</strong>
      </div>
    </header>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="back-button" type="button" onClick={onClick} aria-label="이전 화면">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 5-7 7 7 7" />
      </svg>
    </button>
  )
}

function VinylPlayer({ large = false }: { large?: boolean }) {
  return (
    <div className={`vinyl-player ${large ? 'vinyl-player-large' : ''}`} aria-hidden="true">
      <img className="vinyl" src={asset('CD-Play.png')} alt="" />
      <img className="vinyl-pin" src={asset('CD-pin.png')} alt="" />
    </div>
  )
}

function Experience() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const splashTimerRef = useRef<number | null>(null)
  const objectUrlsRef = useRef<string[]>([])
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [scene, setScene] = useState<Scene>('splash')
  const [countdown, setCountdown] = useState(3)
  const [errorMessage, setErrorMessage] = useState('')
  const [flash, setFlash] = useState(false)
  const [capturedImage, setCapturedImage] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState('')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [selectedShareImage, setSelectedShareImage] = useState('')
  const [shareStatus, setShareStatus] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [catalogTrack, setCatalogTrack] = useState<CatalogTrack | null>(null)
  const [musicMuted, setMusicMuted] = useState(true)

  useEffect(() => {
    const html = document.documentElement
    const { body } = document
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

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
    const objectUrls = objectUrlsRef.current
    return () => {
      stopCamera()
      if (splashTimerRef.current) window.clearTimeout(splashTimerRef.current)
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [stopCamera])

  const requestAnalysis = async (image: string) => {
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
    return data as AnalysisResult
  }

  const captureAndAnalyze = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      setAnalysisError('카메라 화면이 준비되지 않았어요. 다시 시도해 주세요.')
      setScene('matching')
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
    setSelectedShareImage(image)
    setGalleryImages([image])
    setAnalysis(null)
    setCatalogTrack(null)
    setMusicMuted(true)
    setAnalysisError('')
    setFlash(true)
    setScene('matching')
    window.setTimeout(() => setFlash(false), 420)

    try {
      const [result] = await Promise.all([requestAnalysis(image), wait(3000)])
      const track = pickCatalogTrack(result.musicCategory, result.moodMatch)
      setCatalogTrack(track)
      setAnalysis({
        ...result,
        trackTitle: track.title,
        trackArtist: track.artist,
      })
      setMusicMuted(true)
      setScene('result')
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : '분석에 실패했습니다.')
    }
  }

  const startCountdown = async () => {
    setCapturedImage('')
    setAnalysisError('')
    setScene('countdown')
    for (const number of [3, 2, 1]) {
      setCountdown(number)
      await wait(760)
    }
    await captureAndAnalyze()
  }

  const retryCapture = () => {
    setCapturedImage('')
    setAnalysisError('')
    setScene('intro')
  }

  const loadImage = (source: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = source
    })

  const createShareCard = async () => {
    if (!analysis || !selectedShareImage) throw new Error('공유할 결과가 없습니다.')
    const source = await loadImage(selectedShareImage)
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1080
    const context = canvas.getContext('2d')
    if (!context) throw new Error('공유 이미지를 만들 수 없습니다.')

    const scale = Math.max(canvas.width / source.width, canvas.height / source.height)
    const width = source.width * scale
    const height = source.height * scale
    context.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
    const gradient = context.createLinearGradient(0, 250, 0, 1080)
    gradient.addColorStop(0, 'rgba(8, 6, 10, 0.05)')
    gradient.addColorStop(1, 'rgba(8, 6, 10, 0.9)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 1080, 1080)

    context.fillStyle = '#ffffff'
    context.font = '700 42px "NanumSquare Neo", sans-serif'
    context.fillText('GROOVE MOOD MATCH', 76, 730)
    context.fillStyle = '#a873ff'
    context.font = '800 126px "NanumSquare Neo", sans-serif'
    context.fillText(`${analysis.moodMatch}%`, 70, 865)
    context.fillStyle = '#ffffff'
    context.font = '600 36px "NanumSquare Neo", sans-serif'
    context.fillText(analysis.keywords.map((word) => `#${word.replace(/^#/, '')}`).join('  '), 76, 930)
    context.font = '600 30px "NanumSquare Neo", sans-serif'
    context.fillText(`${analysis.trackTitle} · ${analysis.trackArtist}`, 76, 995)

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지 생성 실패'))), 'image/png')
    })
  }

  const downloadShareCard = async () => {
    try {
      const blob = await createShareCard()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'groove-mood.png'
      link.click()
      URL.revokeObjectURL(url)
      setShareStatus('공유 카드를 저장했어요.')
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : '저장하지 못했어요.')
    }
  }

  const returnToStart = () => {
    setCapturedImage('')
    setSelectedShareImage('')
    setGalleryImages([])
    setAnalysis(null)
    setCatalogTrack(null)
    setMusicMuted(true)
    setAnalysisError('')
    setShareStatus('')
    setScene('intro')
  }

  const finishShare = (message: string) => {
    setShareStatus(message)
    window.setTimeout(returnToStart, 1200)
  }

  const shareResult = async () => {
    if (!analysis || isSharing) return
    setIsSharing(true)
    setShareStatus('')
    const shareText = `나의 GROOVE 무드는 ${analysis.moodMatch}%! ${analysis.trackTitle} · ${analysis.trackArtist}`

    try {
      const blob = await createShareCard()
      const file = new File([blob], 'groove-mood.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'GROOVE Mood Match', text: shareText, files: [file] })
        finishShare('친구에게 GROOVE를 보냈어요. 처음으로 돌아갈게요.')
        return
      }

      await navigator.clipboard?.writeText(shareText)
      await downloadShareCard()
      finishShare('공유 문구와 카드를 준비했어요. 처음으로 돌아갈게요.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        setShareStatus('이전 공유 창이 아직 열려 있어요. 닫은 뒤 다시 시도해 주세요.')
        return
      }
      setShareStatus(error instanceof Error ? error.message : '공유하지 못했어요.')
    } finally {
      setIsSharing(false)
    }
  }

  const addGalleryImages = (files: FileList | null) => {
    if (!files?.length) return
    const urls = Array.from(files).map((file) => URL.createObjectURL(file))
    objectUrlsRef.current.push(...urls)
    setGalleryImages((current) => [...current, ...urls])
    setSelectedShareImage(urls[0])
  }

  const youtubeUrl = catalogTrack
    ? youtubeWatchUrl(catalogTrack.videoId)
    : analysis
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${analysis.trackTitle} ${analysis.trackArtist}`,
        )}`
      : '#'

  const musicActive = Boolean(catalogTrack && musicScenes.includes(scene))
  const nowPlayingLabel = useMemo(() => {
    if (!catalogTrack) return ''
    return `${catalogTrack.title} · ${catalogTrack.artist}`
  }, [catalogTrack])

  const showCapturedFrame = capturedImage && !['splash', 'intro', 'countdown'].includes(scene)

  return (
    <main className="page">
      <section className={`xr-frame scene-${scene}`}>
        <GrooveMusic track={catalogTrack} muted={musicMuted} active={musicActive} />
        <video ref={videoRef} className="camera-feed" muted playsInline aria-label="실시간 카메라 화면" />
        {showCapturedFrame && <img className="captured-frame" src={capturedImage} alt="촬영된 칵테일" />}
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
            <SpriteMascot variant="coffee" size="large" />
            <button className="shoot-button" type="button" onClick={startCountdown}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7.5 7 9 4.8h6L16.5 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              눌러서 촬영
            </button>
          </div>
        )}

        {cameraState === 'active' && scene === 'countdown' && (
          <div className="scene countdown-scene">
            <span key={countdown}>{countdown}</span>
            <p>잠시 그대로 있어주세요</p>
          </div>
        )}

        {cameraState === 'active' && scene === 'matching' && (
          <div className="scene matching-scene">
            {analysisError ? (
              <div className="analysis-error">
                <SpriteMascot variant="coffee" size="large" />
                <p>{analysisError}</p>
                <button type="button" onClick={retryCapture}>다시 촬영</button>
              </div>
            ) : (
              <>
                <p>NOW GROOVING...</p>
                <div className="matching-visual">
                  <span className="mood-wave wave-one" />
                  <span className="mood-wave wave-two" />
                  <span className="mood-wave wave-three" />
                  <SpriteMascot variant="cozy" size="large" />
                </div>
                <svg className="matching-progress" viewBox="0 0 600 40" aria-hidden="true">
                  <path
                    className="wave-track"
                    d="M0 20 Q15 3 30 20 T60 20 T90 20 T120 20 T150 20 T180 20 T210 20 T240 20 T270 20 T300 20 T330 20 T360 20 T390 20 T420 20 T450 20 T480 20 T510 20 T540 20 T570 20 T600 20"
                  />
                  <path
                    className="wave-progress"
                    d="M0 20 Q15 3 30 20 T60 20 T90 20 T120 20 T150 20 T180 20 T210 20 T240 20 T270 20 T300 20 T330 20 T360 20 T390 20 T420 20 T450 20 T480 20 T510 20 T540 20 T570 20 T600 20"
                  />
                </svg>
                <small>사진 속 분위기를 음악으로 바꾸는 중</small>
              </>
            )}
          </div>
        )}

        {cameraState === 'active' && scene === 'result' && analysis && (
          <div className="scene result-scene">
            <h1>무드매치 결과가 나왔어요!</h1>
            <div className="result-content">
              <div className="result-mascot"><SpriteMascot variant="cocktail" size="large" /></div>
              <article className="mood-card">
                <VinylPlayer />
                {analysis.cocktailName !== '칵테일 판별 불가' && (
                  <div className="cocktail-name">
                    <span>{analysis.cocktailName}</span>
                    <small>칵테일 신뢰도 {analysis.cocktailConfidence}%</small>
                  </div>
                )}
                <h2>MOOD MATCH</h2>
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
                  <div className="track-actions">
                    <button
                      className="listen-button"
                      type="button"
                      onClick={() => setMusicMuted((current) => !current)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 8 6 4-6 4V8Z" /></svg>
                      {musicMuted ? '소리 켜기' : '음소거'}
                    </button>
                    <button className="listen-button ghost" type="button" onClick={() => setScene('music')}>
                      플레이어
                    </button>
                  </div>
                  {musicMuted && (
                    <small className="music-hint">결과가 나오면 음악이 함께 재생돼요. 탭해서 소리를 켜보세요.</small>
                  )}
                </div>
              </article>
            </div>
            <nav className="tool-rail" aria-label="결과 도구">
              <button type="button" aria-label="음악" onClick={() => setScene('music')}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 18V6l10-2v12M9 10l10-2" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" />
                </svg>
              </button>
              <button type="button" aria-label="위치">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
              </button>
              <button type="button" aria-label="저장" onClick={downloadShareCard}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z" /></svg>
              </button>
              <button type="button" aria-label="공유" onClick={() => setScene('share')}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4M6 11H4v9h16v-9h-2" /></svg>
              </button>
            </nav>
          </div>
        )}

        {cameraState === 'active' && scene === 'music' && analysis && (
          <div className="scene music-scene">
            <BackButton onClick={() => setScene('result')} />
            <h1>오늘의 GROOVE 음악을 추천해요</h1>
            <SpriteMascot variant="listen" size="large" />
            <button className="music-card" type="button" onClick={() => setScene('player')}>
              <span className="album-dot" />
              <span><b>{analysis.trackTitle}</b><small>{analysis.trackArtist}</small></span>
              <i>›</i>
            </button>
            <div className="sound-wave" aria-hidden="true">
              {Array.from({ length: 20 }, (_, index) => <i key={index} />)}
            </div>
          </div>
        )}

        {cameraState === 'active' && scene === 'player' && analysis && (
          <div className="scene player-scene">
            <BackButton onClick={() => setScene('music')} />
            <div className="now-playing-pill">
              <span className="album-dot" />
              <span><b>{analysis.trackTitle}</b><small>{analysis.trackArtist}</small></span>
            </div>
            <VinylPlayer large />
            <div className="player-mascot"><SpriteMascot variant="listen" size="large" /></div>
            <div className="player-actions">
              <button
                className="youtube-play"
                type="button"
                onClick={() => setMusicMuted((current) => !current)}
              >
                <span>{musicMuted ? '▶' : 'Ⅱ'}</span>
                {musicMuted ? '소리 켜기' : '재생 중'}
              </button>
              <a className="recommend-friend" href={youtubeUrl} target="_blank" rel="noreferrer">
                YouTube에서 열기
              </a>
              <button className="recommend-friend" type="button" onClick={() => setScene('share')}>
                친구에게 추천
              </button>
            </div>
            {nowPlayingLabel && <p className="now-playing-caption">{nowPlayingLabel}</p>}
          </div>
        )}

        {cameraState === 'active' && scene === 'share' && analysis && (
          <div className="scene share-scene">
            <BackButton onClick={() => setScene('result')} />
            <h1>친구에게 GROOVE 하기</h1>
            <div className="share-summary">
              <span>MOOD MATCH</span>
              <strong>{analysis.moodMatch}%</strong>
              <div>{analysis.keywords.map((word) => <i key={word}>#{word.replace(/^#/, '')}</i>)}</div>
              <p>{analysis.trackTitle} · {analysis.trackArtist}</p>
            </div>
            <div className="share-mascot">
              <SpriteMascot variant="coffee" size="large" />
            </div>
            <div className="share-flow-actions">
              <button className="primary-flow-button" type="button" onClick={() => setScene('gallery')}>
                보낼 사진 고르기
              </button>
              <button className="reset-flow-button" type="button" onClick={returnToStart}>
                처음으로
              </button>
            </div>
          </div>
        )}

        {cameraState === 'active' && scene === 'gallery' && analysis && (
          <div className="scene gallery-scene">
            <BackButton onClick={() => setScene('share')} />
            <h1>함께 보낼 순간을 골라보세요</h1>
            <div className="share-preview">
              <img src={selectedShareImage || capturedImage} alt="선택한 공유 사진" />
              <div><b>{analysis.moodMatch}% GROOVE</b><span>{analysis.trackTitle}</span></div>
            </div>
            <div className="gallery-strip">
              {galleryImages.map((image, index) => (
                <button
                  className={image === selectedShareImage ? 'selected' : ''}
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => setSelectedShareImage(image)}
                >
                  <img src={image} alt={`공유 후보 ${index + 1}`} />
                </button>
              ))}
              <label className="add-photo">
                <input type="file" accept="image/*" multiple onChange={(event) => addGalleryImages(event.target.files)} />
                <span>＋</span>
                사진 추가
              </label>
            </div>
            <div className="gallery-actions">
              <button type="button" onClick={downloadShareCard}>이미지 저장</button>
              <button type="button" onClick={shareResult} disabled={isSharing}>
                {isSharing ? '공유 준비 중…' : '친구에게 보내기'}
              </button>
            </div>
            {shareStatus && <p className="share-status">{shareStatus}</p>}
            <div className="gallery-mascot"><SpriteMascot variant="cozy" size="small" /></div>
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

export default Experience
