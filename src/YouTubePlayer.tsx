import { useEffect, useRef } from 'react'

type YTPlayer = {
  destroy: () => void
  mute: () => void
  unMute: () => void
  playVideo: () => void
  pauseVideo: () => void
  setVolume: (volume: number) => void
  loadVideoById: (videoId: string) => void
}

type YTNamespace = {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string
      width?: number | string
      height?: number | string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: { data: number; target: YTPlayer }) => void
        onError?: (event: { data: number }) => void
      }
    },
  ) => YTPlayer
  PlayerState: { ENDED: number; PLAYING: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiLoader: Promise<YTNamespace> | null = null

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiLoader) return apiLoader

  apiLoader = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
    }

    if (!document.querySelector('script[data-groove-youtube]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.dataset.grooveYoutube = 'true'
      document.head.appendChild(script)
    }

    if (window.YT?.Player) resolve(window.YT)
  })

  return apiLoader
}

export function YouTubePlayer({
  videoId,
  muted,
  active,
}: {
  videoId: string | null
  muted: boolean
  active: boolean
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  useEffect(() => {
    if (!videoId || !active || !hostRef.current) {
      playerRef.current?.pauseVideo()
      return
    }

    let cancelled = false
    const host = hostRef.current

    loadYouTubeApi().then((YT) => {
      if (cancelled || !host) return

      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId)
        if (mutedRef.current) playerRef.current.mute()
        else {
          playerRef.current.unMute()
          playerRef.current.setVolume(100)
        }
        playerRef.current.playVideo()
        return
      }

      playerRef.current = new YT.Player(host, {
        videoId,
        width: 320,
        height: 180,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          loop: 1,
          playlist: videoId,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (mutedRef.current) event.target.mute()
            else {
              event.target.unMute()
              event.target.setVolume(100)
            }
            event.target.playVideo()
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              event.target.playVideo()
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
    }
  }, [videoId, active])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !active) return
    if (muted) {
      player.mute()
    } else {
      player.unMute()
      player.setVolume(100)
      player.playVideo()
    }
  }, [muted, active])

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.destroy()
      } catch {
        // ignore teardown errors
      }
      playerRef.current = null
    }
  }, [])

  if (!videoId || !active) return null

  return (
    <div className="groove-music-shell" aria-hidden="true">
      <div ref={hostRef} className="groove-music-host" />
    </div>
  )
}
