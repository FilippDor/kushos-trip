// src/Hub.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

// Supabase init
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Universal URL preview fetch
const fetchUrlPreview = async (url) => {
  try {
    const res = await fetch(`/api/resolveUrl?url=${encodeURIComponent(url)}`)
    if (!res.ok) return { title: url, image: '' }
    const json = await res.json()
    return { title: json.title || url, image: json.image || '' }
  } catch {
    return { title: url, image: '' }
  }
}

export default function Hub() {
  const navigate = useNavigate()
  const [categories] = useState(['Beaches', 'Hiking', 'Nightlife', 'Culture', 'Food'])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [links, setLinks] = useState([])
  const [newLink, setNewLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchLinks = async (category) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hub_links')
        .select('*')
        .eq('category', category)
        .order('votes', { ascending: false })
      if (error) throw error
      setLinks(data || [])
    } catch (err) {
      console.error('Error fetching links:', err)
      setLinks([])
    } finally {
      setLoading(false)
    }
  }

  const openCategory = (category) => {
    setSelectedCategory(category)
    fetchLinks(category)
  }

  const closeCategory = () => {
    setSelectedCategory(null)
    setLinks([])
    setNewLink('')
  }

  const addLink = async () => {
    const trimmed = newLink.trim()
    if (!trimmed || !selectedCategory) return

    setSaving(true)
    try {
      // prevent duplicate
      const { data: existing } = await supabase
        .from('hub_links')
        .select('*')
        .eq('category', selectedCategory)
        .eq('url', trimmed)
        .maybeSingle()

      if (existing) {
        setLinks(prev => [...prev].sort((a, b) => (b.votes || 0) - (a.votes || 0)))
        setNewLink('')
        setSaving(false)
        return
      }

      const preview = await fetchUrlPreview(trimmed)

      const { data: inserted, error } = await supabase
        .from('hub_links')
        .insert([{
          category: selectedCategory,
          url: trimmed,
          title: preview.title,
          image: preview.image,
          votes: 0
        }])
        .select()

      if (error) throw error

      setLinks(prev => [...prev, inserted[0]].sort((a, b) => (b.votes || 0) - (a.votes || 0)))
      setNewLink('')
    } catch (err) {
      console.error('Add link failed', err)
      alert('Could not add link.')
    } finally {
      setSaving(false)
    }
  }

  const upvoteLink = async (linkId) => {
    const link = links.find(l => l.id === linkId)
    if (!link) return
    try {
      const { data, error } = await supabase
        .from('hub_links')
        .update({ votes: (link.votes || 0) + 1 })
        .eq('id', linkId)
        .select()
      if (error) throw error
      setLinks(prev =>
        prev
          .map(l => (l.id === linkId ? data[0] : l))
          .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      )
    } catch (err) {
      console.error('Upvote failed', err)
    }
  }

  const deleteLink = async (linkId) => {
    if (!confirm('Delete this link for everyone?')) return
    try {
      await supabase.from('hub_links').delete().eq('id', linkId)
      setLinks(prev => prev.filter(l => l.id !== linkId))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🌴 Canarias Hub</h1>

      {!selectedCategory && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat}
              className="bg-indigo-500 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-transform"
              onClick={() => openCategory(cat)}
            >
              <h2 className="text-xl font-semibold text-center">{cat}</h2>
            </div>
          ))}
        </div>
      )}

      {selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 p-4 z-50 overflow-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button onClick={closeCategory} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold">✖</button>
            <h2 className="text-2xl font-bold mb-4">{selectedCategory}</h2>

            {/* Add link */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Paste any link"
                className="border p-2 rounded flex-1"
              />
              <button onClick={addLink} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded">
                {saving ? 'Saving…' : 'Add'}
              </button>
            </div>

            {loading ? (
              <p>Loading…</p>
            ) : (
              <ul className="list-none space-y-3">
                {links.map(link => (
                  <li key={link.id} className="border rounded p-3 flex flex-col gap-2">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                      {link.image && (
                        <img src={link.image} alt={link.title} className="w-20 h-16 object-cover rounded" />
                      )}
                      <div>{link.title || link.url}</div>
                    </a>

                    <div className="flex justify-between mt-2">
                      <button onClick={() => deleteLink(link.id)} className="px-3 py-1 bg-red-500 text-white rounded">❌</button>
                      <button onClick={() => upvoteLink(link.id)} className="px-3 py-1 bg-yellow-400 rounded">👍 {link.votes}</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 text-center">
              <button onClick={() => navigate('/planner')} className="px-6 py-2 bg-green-600 text-white rounded-lg">Go to Planner 🗳️</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
