import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeCocktailImage } from './analyze.js'

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

  try {
    response.json(await analyzeCocktailImage(image))
  } catch (error) {
    console.error('OpenAI image analysis failed:', error)
    const missingKey = error instanceof Error && error.message.includes('OPENAI_API_KEY')
    response.status(missingKey ? 503 : 500).json({
      error: missingKey
        ? 'OPENAI_API_KEY가 설정되지 않았습니다.'
        : '이미지 분석에 실패했습니다. 다시 촬영해 주세요.',
    })
  }
})

app.use(express.static(distPath))
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, '0.0.0.0', () => {
  console.log(`GROOVE API server: http://localhost:${port}`)
})
