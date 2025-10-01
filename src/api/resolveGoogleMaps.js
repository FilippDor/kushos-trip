// api/resolveGoogleMaps.js
import fetch from 'node-fetch'

export default async function handler(req, res) {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'Missing URL' })

    // Follow redirects to resolve short mobile URLs
    const finalUrl = await resolveRedirect(url)

    // Only allow Google Maps URLs
    if (!finalUrl.includes('google.com/maps')) {
      return res.status(400).json({ error: 'Not a valid Google Maps URL' })
    }

    // Fetch oEmbed preview
    const oembedRes = await fetch(`https://www.google.com/maps/oembed?url=${encodeURIComponent(finalUrl)}&format=json`)
    if (!oembedRes.ok) return res.status(500).json({ title: finalUrl, image: '' })

    const json = await oembedRes.json()

    res.status(200).json({
      title: json.title || finalUrl,
      image: json.thumbnail_url || ''
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ title: url, image: '' })
  }
}

// Helper to resolve short URLs (maps.app.goo.gl / goo.gl/maps)
async function resolveRedirect(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return response.url || url
  } catch {
    return url
  }
}
