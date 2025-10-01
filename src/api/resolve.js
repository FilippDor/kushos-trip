import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

export async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  try {
    // Follow the short link to the final Google Maps page
    const response = await fetch(url, { redirect: 'follow' })
    const html = await response.text()

    // Parse HTML to extract <title> and og:image
    const $ = cheerio.load(html)
    const title = $('title').text() || url
    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('link[rel="icon"]').attr('href') ||
      ''

    return res.status(200).json({ title, image })
  } catch (err) {
    console.error('Error resolving Google Maps URL:', err)
    return res.status(500).json({ title: url, image: '' })
  }
}
