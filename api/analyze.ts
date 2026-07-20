import type { VercelRequest, VercelResponse } from '@vercel/node'
import { analyzeCocktailImage } from '../server/analyze.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'POST 요청만 지원합니다.' })
    return
  }

  const image = request.body?.image
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    response.status(400).json({ error: '유효한 촬영 이미지가 필요합니다.' })
    return
  }

  try {
    response.status(200).json(await analyzeCocktailImage(image))
  } catch (error) {
    console.error('OpenAI image analysis failed:', error)
    const missingKey = error instanceof Error && error.message.includes('OPENAI_API_KEY')
    response.status(missingKey ? 503 : 500).json({
      error: missingKey
        ? '서비스 설정이 완료되지 않았습니다.'
        : '이미지 분석에 실패했습니다. 다시 촬영해 주세요.',
    })
  }
}
