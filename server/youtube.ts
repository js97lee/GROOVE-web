import { pickCatalogTrack, type MusicCategory } from './musicCatalog.js'

type SearchResult = {
  videoId: string
  title: string
  artist: string
}

type YouTubeSearchItem = {
  id?: { videoId?: string }
  snippet?: { title?: string; channelTitle?: string }
}

async function isEmbeddable(videoId: string, apiKey: string) {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('part', 'status')
  url.searchParams.set('id', videoId)
  url.searchParams.set('key', apiKey)

  const response = await fetch(url)
  if (!response.ok) return false

  const data = (await response.json()) as {
    items?: Array<{ status?: { embeddable?: boolean } }>
  }
  return data.items?.[0]?.status?.embeddable === true
}

export async function resolveYouTubeTrack(
  category: MusicCategory,
  trackTitle: string,
  trackArtist: string,
  seed = 0,
): Promise<SearchResult> {
  const fallback = pickCatalogTrack(category, seed)
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    return fallback
  }

  // 카탈로그 곡이 임베드 가능하면 우선 사용 (프로토타입 안정성)
  if (await isEmbeddable(fallback.videoId, apiKey)) {
    return fallback
  }

  const query = `${trackTitle} ${trackArtist} official audio`.trim()
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('videoEmbeddable', 'true')
  url.searchParams.set('maxResults', '5')
  url.searchParams.set('q', query)
  url.searchParams.set('key', apiKey)

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error('YouTube search failed:', response.status, await response.text())
      return fallback
    }

    const data = (await response.json()) as { items?: YouTubeSearchItem[] }
    for (const item of data.items ?? []) {
      const videoId = item.id?.videoId
      if (!videoId) continue
      if (!(await isEmbeddable(videoId, apiKey))) continue

      return {
        videoId,
        title: trackTitle || item.snippet?.title || fallback.title,
        artist: trackArtist || item.snippet?.channelTitle || fallback.artist,
      }
    }

    return fallback
  } catch (error) {
    console.error('YouTube search error:', error)
    return fallback
  }
}
