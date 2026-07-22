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

  const query = `${trackTitle} ${trackArtist} official audio`.trim()
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('videoEmbeddable', 'true')
  url.searchParams.set('maxResults', '1')
  url.searchParams.set('q', query)
  url.searchParams.set('key', apiKey)

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error('YouTube search failed:', response.status, await response.text())
      return fallback
    }

    const data = (await response.json()) as { items?: YouTubeSearchItem[] }
    const item = data.items?.[0]
    const videoId = item?.id?.videoId
    if (!videoId) return fallback

    return {
      videoId,
      title: trackTitle || item.snippet?.title || fallback.title,
      artist: trackArtist || item.snippet?.channelTitle || fallback.artist,
    }
  } catch (error) {
    console.error('YouTube search error:', error)
    return fallback
  }
}
