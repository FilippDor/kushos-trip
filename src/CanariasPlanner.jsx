import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import TinderCard from 'react-tinder-card'
import { motion } from 'framer-motion'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const MAX_TOKENS = 10
const MAX_TOKENS_PER_CARD = 3

export default function CanariasPlanner() {
  const [step, setStep] = useState('welcome')
  const [playerName, setPlayerName] = useState('')
  const [currentCard, setCurrentCard] = useState(0)
  const [allocations, setAllocations] = useState({})
  const [musts, setMusts] = useState({})

  const activities = [
    { name: 'Beach', emoji: '🏖️', image: 'https://source.unsplash.com/600x400/?beach' },
    { name: 'Hiking', emoji: '🥾', image: 'https://source.unsplash.com/600x400/?hiking' },
    { name: 'Nightlife', emoji: '🎉', image: 'https://source.unsplash.com/600x400/?party' },
    { name: 'Culture', emoji: '🏛️', image: 'https://source.unsplash.com/600x400/?museum' },
    { name: 'Food', emoji: '🍲', image: 'https://source.unsplash.com/600x400/?food' }
  ]

  const initializePlayer = (name) => {
    if (!allocations[name]) setAllocations(prev => ({ ...prev, [name]: {} }))
    if (!musts[name]) setMusts(prev => ({ ...prev, [name]: {} }))
  }

  const getUsedTokens = () => {
    return activities.reduce((sum, activity) => {
      const plusOne = allocations[playerName]?.[activity.name] || 0
      const must = musts[playerName]?.[activity.name] ? 2 : 0
      return sum + Math.min(plusOne + must, MAX_TOKENS_PER_CARD)
    }, 0)
  }

  const getRemainingTokens = () => MAX_TOKENS - getUsedTokens()

  const toggleToken = (activityName) => {
    const current = allocations[playerName]?.[activityName] || 0
    const must = musts[playerName]?.[activityName] ? 2 : 0
    const total = current + must

    if (current === 1) {
      setAllocations(prev => ({
        ...prev,
        [playerName]: { ...prev[playerName], [activityName]: 0 }
      }))
    } else if (total < MAX_TOKENS_PER_CARD && getRemainingTokens() >= 1) {
      setAllocations(prev => ({
        ...prev,
        [playerName]: { ...prev[playerName], [activityName]: 1 }
      }))
    }
  }

  const toggleMust = (activityName) => {
    const isMust = musts[playerName]?.[activityName] || false
    const plusOne = allocations[playerName]?.[activityName] || 0
    const total = plusOne + (isMust ? 0 : 2)

    if (isMust) {
      setMusts(prev => ({
        ...prev,
        [playerName]: { ...prev[playerName], [activityName]: false }
      }))
    } else if (total <= MAX_TOKENS_PER_CARD && getRemainingTokens() >= 2) {
      setMusts(prev => ({
        ...prev,
        [playerName]: { ...prev[playerName], [activityName]: true }
      }))
    }
  }

  const handleSwipe = (dir) => {
    const activityName = activities[currentCard]?.name
    if (!activityName) return

    if (dir === 'left') {
      setAllocations(prev => ({
        ...prev,
        [playerName]: { ...prev[playerName], [activityName]: 0 }
      }))
      setMusts(prev => ({
        ...prev,
        [playerName]: { ...prev[playerName], [activityName]: false }
      }))
    }

    if (currentCard + 1 >= activities.length) setStep('summary')
    setCurrentCard(prev => prev + 1)
  }

  const handleStart = () => {
    if (!playerName.trim()) return
    initializePlayer(playerName.trim())
    setStep('cards')
  }

  const saveSession = async () => {
    const payload = activities.map(activity => {
      const plusOne = allocations[playerName]?.[activity.name] || 0
      const must = musts[playerName]?.[activity.name] ? true : false
      return {
        activity: activity.name,
        token: plusOne,
        must,
        total: Math.min(plusOne + (must ? 2 : 0), MAX_TOKENS_PER_CARD)
      }
    })

    const { error } = await supabase
      .from('sessions')
      .insert([
        {
          slug: `family2025-${playerName}-${Date.now()}`,
          data: payload
        }
      ])

    if (error) {
      console.error('Error saving session:', error)
      alert('Error saving session. Check console.')
    } else {
      alert('Session saved successfully!')
    }
  }

  if (step === 'welcome') {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">🏝️ Canarias Cousins Planner</h1>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Start
        </button>
      </div>
    )
  }

  const activity = activities[currentCard]

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      {step === 'cards' && activity && (
        <TinderCard
          key={`card-${activity.name}-${currentCard}`}
          onSwipe={handleSwipe}
          preventSwipe={['up','down']}
        >
          <motion.div
            className="bg-white rounded-xl shadow-xl p-4 flex flex-col justify-between"
            whileHover={{ scale: 1.03 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span>{playerName}</span>
              <span className="text-sm font-semibold text-gray-700">
                Tokens left: {getRemainingTokens()}
              </span>
            </div>

            <img src={activity.image} alt={activity.name} className="h-64 w-full object-cover rounded-lg" />
            <h2 className="text-xl font-bold mt-2">{activity.emoji} {activity.name}</h2>

            <div className="mt-4 flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 1.2 }}
                onClick={() => toggleToken(activity.name)}
                className={`px-3 py-1 rounded-lg ${allocations[playerName]?.[activity.name] === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                +1 Token
              </motion.button>

              <motion.button
                whileTap={{ scale: 1.2 }}
                onClick={() => toggleMust(activity.name)}
                className={`px-3 py-1 rounded-lg ${musts[playerName]?.[activity.name] ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
              >
                🔥 MUST
              </motion.button>

              <span>
                {Math.min((allocations[playerName]?.[activity.name] || 0) + (musts[playerName]?.[activity.name] ? 2 : 0), MAX_TOKENS_PER_CARD)} / {MAX_TOKENS_PER_CARD}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500">Swipe right to keep / swipe left to skip</p>
          </motion.div>
        </TinderCard>
      )}

      {step === 'summary' && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">🎉 All cards done!</h2>
          <p className="text-gray-700">Here’s what you selected:</p>

          <div className="border rounded-lg p-2 my-1 text-left">
            <strong>{playerName}:</strong>
            <ul>
              {activities.map(activity => {
                const plusOne = allocations[playerName]?.[activity.name] || 0
                const must = musts[playerName]?.[activity.name] || false
                const total = Math.min(plusOne + (must ? 2 : 0), MAX_TOKENS_PER_CARD)
                if (total === 0) return null
                return (
                  <li key={activity.name}>
                    {activity.emoji} {activity.name}: {total} {must ? '🔥' : ''}
                  </li>
                )
              })}
            </ul>
          </div>

          <button
            onClick={saveSession}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
