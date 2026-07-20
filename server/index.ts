import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = Number(process.env.API_PORT || 8787)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')

app.use(express.json({ limit: '12mb' }))

app.post('/api/analyze', async (request, response) => {
  const image = request.body?.image

  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    response.status(400).json({ error: '유효한 촬영 이미지가 필요합니다.' })
    return
  }

  if (!process.env.OPENAI_API_KEY) {
    response.status(503).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' })
    return
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const result = await openai.responses.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                '당신은 칵테일과 음악 큐레이션 전문가입니다.',
                '촬영 이미지를 보고 잔, 색상, 가니시, 질감을 근거로 가장 가능성 높은 칵테일을 판별하세요.',
                '칵테일 판별 신뢰도와 사진의 분위기가 추천 음악과 어울리는 정도를 각각 0~100 정수로 표현하세요.',
                '사진의 감성을 나타내는 짧은 한국어 키워드를 정확히 3개 제시하세요.',
                '음악 카테고리는 Jazz, R&B, 고전 영화 OST 중 가장 잘 맞는 하나만 고르세요.',
                '실제로 존재하는 곡 하나와 아티스트 또는 작곡가를 추천하고, 사진과 어울리는 이유를 한국어 한 문장으로 설명하세요.',
                '이미지에 칵테일이 명확하지 않으면 cocktailName을 "칵테일 판별 불가"로 쓰고 신뢰도를 낮게 설정하세요.',
              ].join('\n'),
            },
            {
              type: 'input_image',
              image_url: image,
              detail: 'low',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'groove_cocktail_mood',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              cocktailName: { type: 'string' },
              cocktailConfidence: { type: 'integer', minimum: 0, maximum: 100 },
              moodMatch: { type: 'integer', minimum: 0, maximum: 100 },
              keywords: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: { type: 'string' },
              },
              musicCategory: {
                type: 'string',
                enum: ['Jazz', 'R&B', '고전 영화 OST'],
              },
              trackTitle: { type: 'string' },
              trackArtist: { type: 'string' },
              recommendationReason: { type: 'string' },
            },
            required: [
              'cocktailName',
              'cocktailConfidence',
              'moodMatch',
              'keywords',
              'musicCategory',
              'trackTitle',
              'trackArtist',
              'recommendationReason',
            ],
          },
        },
      },
      max_output_tokens: 500,
    })

    const analysis = JSON.parse(result.output_text)
    response.json(analysis)
  } catch (error) {
    console.error('OpenAI image analysis failed:', error)
    response.status(500).json({ error: '이미지 분석에 실패했습니다. 다시 촬영해 주세요.' })
  }
})

app.use(express.static(distPath))
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, '0.0.0.0', () => {
  console.log(`GROOVE API server: http://localhost:${port}`)
})
