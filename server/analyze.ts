import OpenAI from 'openai'

export async function analyzeCocktailImage(image: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.')
  }

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
              '이미지에 특정 칵테일이 명확하지 않으면 가장 가까운 음료 스타일을 추정해 이름을 쓰고 신뢰도를 낮게 설정하세요.',
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

  return JSON.parse(result.output_text)
}
