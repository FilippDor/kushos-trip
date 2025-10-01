// /api/preview.js

export default async function handler(req, res) {
  try {
    const url = req.query.url
    if (!url) return res.status(400).json({ error: 'Missing URL' })

    const oembedUrl = `https://www.google.com/maps/oembed?url=${encodeURIComponent(url)}&format=json`
    const response = await fetch(oembedUrl)
    if (!response.ok) return res.status(200).json({ title: url, image: '' })

    const data = await response.json()
    res.status(200).json({
      title: data.title || url,
      image: data.thumbnail_url || ''
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ title: req.query.url || '', image: '' })
  }
}
