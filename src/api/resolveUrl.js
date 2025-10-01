// api/resolveUrl.js
import fetch from 'node-fetch'

export async function handler(req, res) {
  const url = req.query.url
  if (!url) return res.status(400).json({ error: 'No URL provided' })

  try {
    const response = await fetch(url)
    const html = await response.text()
    const match = html.match(/<title>(.*?)<\/title>/i)
    const title = match ? match[1] : url
    const imageMatch = html.match(/<meta property=["']og:image["'] content=["'](.*?)["']/i)
    const image = imageMatch ? imageMatch[1] : ''
    res.status(200).json({ title, image })
  } catch (err) {
    res.status(500).json({ title: url, image: '', error: err.message })
  }
}
