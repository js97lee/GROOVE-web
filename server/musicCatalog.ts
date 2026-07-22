export type MusicCategory = 'Jazz' | 'R&B' | '고전 영화 OST'

export type CatalogTrack = {
  videoId: string
  title: string
  artist: string
}

/** 카테고리별 고정 YouTube 곡 — 프로토타입용 안정 재생 맵 */
export const musicCatalog: Record<MusicCategory, CatalogTrack[]> = {
  Jazz: [
    { videoId: 'ImllpvDwbQ8', title: 'Nightrider', artist: 'Tom Misch & Yussef Dayes' },
    { videoId: 'jVDLJpF1c_s', title: 'It\'s Only a Paper Moon', artist: 'Ella Fitzgerald' },
  ],
  'R&B': [
    { videoId: 'MS91kqWKP3Y', title: 'Kill Bill', artist: 'SZA' },
    { videoId: 'SQnc1QibJIg', title: 'Good Days', artist: 'SZA' },
  ],
  '고전 영화 OST': [
    { videoId: 'GTWqwSnMh8M', title: 'City of Stars', artist: 'La La Land OST' },
    { videoId: 'OMrT3SAs1-Y', title: 'Moon River', artist: 'Breakfast at Tiffany\'s' },
  ],
}

export function pickCatalogTrack(category: MusicCategory, seed = 0): CatalogTrack {
  const list = musicCatalog[category] ?? musicCatalog.Jazz
  return list[Math.abs(Math.round(seed)) % list.length]
}
