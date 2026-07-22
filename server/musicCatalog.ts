export type MusicCategory = 'Jazz' | 'R&B' | '고전 영화 OST'

export type CatalogTrack = {
  videoId: string
  title: string
  artist: string
}

/** oEmbed로 유효성 확인된 임베드용 YouTube 곡 맵 */
export const musicCatalog: Record<MusicCategory, CatalogTrack[]> = {
  Jazz: [
    { videoId: 'ImllpvDwbQ8', title: 'Nightrider', artist: 'Tom Misch & Yussef Dayes' },
    { videoId: 'vmDDOFXSgAs', title: 'Take Five', artist: 'Dave Brubeck' },
  ],
  'R&B': [
    { videoId: 'SQnc1QibapQ', title: 'Kill Bill', artist: 'SZA' },
    { videoId: 'UQss35yEfWc', title: 'Kill Bill (Remix)', artist: 'SZA feat. Doja Cat' },
  ],
  '고전 영화 OST': [
    { videoId: 'GTWqwSNQCcg', title: 'City of Stars', artist: 'La La Land OST' },
    { videoId: 'cZAw8qxn0ZE', title: 'City of Stars (Clip)', artist: 'La La Land' },
  ],
}

export function pickCatalogTrack(category: MusicCategory, seed = 0): CatalogTrack {
  const list = musicCatalog[category] ?? musicCatalog.Jazz
  return list[Math.abs(Math.round(seed)) % list.length]
}
