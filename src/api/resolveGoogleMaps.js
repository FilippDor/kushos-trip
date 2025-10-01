// functions/resolveGoogleMaps.js (Node.js / Netlify / Vercel)
import fetch from 'node-fetch'

export async function handler(event) {
  const { url } = event.queryStringParameters || {}

  if (!url || !url.startsWith('https://share.google')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid share.google URL' })
    }
  }

  try {
    const res = await fetch(url)
    const html = await res.text()

    // Extract OG:title
    const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/)
    const title = titleMatch ? titleMatch[1] : url

    // Extract OG:image
    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/)
    const image = imageMatch ? imageMatch[1] : ''

    return {
      statusCode: 200,
      body: JSON.stringify({ title, image })
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch preview' })
    }
  }
}
