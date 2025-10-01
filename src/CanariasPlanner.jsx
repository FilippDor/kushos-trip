import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function CanariasPlanner() {
  const [slug, setSlug] = useState('family2025')
  const [players, setPlayers] = useState(['Anna','Luis','Maria'])
  const [allocations, setAllocations] = useState({})
  const [musts, setMusts] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true)
      let { data, error } = await supabase
        .from('sessions')
        .select('data')
        .eq('slug', slug)
        .single()

      if (!error && data) {
        setPlayers(data.data.players || [])
        setAllocations(data.data.allocations || {})
        setMusts(data.data.musts || {})
      }
      setLoading(false)
    }
    fetchSession()
  }, [slug])

  const saveSession = async () => {
    const payload = { players, allocations, musts }
    await supabase.from('sessions')
      .upsert({ slug, data: payload })
    alert("Session saved!")
  }

  const toggleMust = (player, activity) => {
    setMusts(prev => ({
      ...prev,
      [player]: { ...prev[player], [activity]: !prev[player]?.[activity] }
    }))
  }

  const addToken = (player, activity) => {
    setAllocations(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        [activity]: (prev[player]?.[activity] || 0) + 1
      }
    }))
  }

  const activities = ['Beach','Hiking','Nightlife','Culture','Food']

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg space-y-6">
      <h1 className="text-2xl font-bold text-center">🏝️ Canarias Cousins Planner</h1>

      {loading ? <p>Loading...</p> : (
        <>
          {players.map(player => (
            <div key={player} className="p-4 border rounded-lg space-y-2">
              <h2 className="font-semibold">{player}</h2>
              {activities.map(act => (
                <div key={act} className="flex items-center justify-between">
                  <span>{act}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addToken(player, act)}
                      className="px-2 py-1 bg-blue-500 text-white rounded-lg"
                    >
                      +1
                    </button>
                    <span>{allocations[player]?.[act] || 0}</span>
                    <button
                      onClick={() => toggleMust(player, act)}
                      className={`px-2 py-1 rounded-lg ${musts[player]?.[act] ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      MUST
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      <button
        onClick={saveSession}
        className="w-full py-2 bg-indigo-600 text-white rounded-lg"
      >
        Save Session
      </button>
    </div>
  )
}