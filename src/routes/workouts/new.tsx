import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import { getCurrentUserProfile, getExercisesList, createCustomExercise, getTrainerClientsList, saveWorkoutSession } from '../../lib/actions'
import DatePicker from '../../components/DatePicker'

export const Route = createFileRoute('/workouts/new')({
  ssr: false,
  component: LogWorkoutPage,
})

interface SetInput {
  setNumber: number;
  reps: string;
  weight: string;
  durationSeconds: string;
  distance: string;
  restSeconds: string;
  intensity: string;
  notes: string;
}

interface ExerciseInput {
  exerciseId: string;
  name: string;
  category: string;
  defaultUnit: string;
  notes: string;
  orderIndex: number;
  sets: SetInput[];
}

function LogWorkoutPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // App & Load States
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'individual' | 'trainer'>('individual')
  const [exercisesList, setExercisesList] = useState<any[]>([])
  const [clientsList, setClientsList] = useState<any[]>([])

  // Selection states
  const [selectedClientId, setSelectedClientId] = useState('')

  // Form State
  const [title, setTitle] = useState('Daily Training Session')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [durationMinutes, setDurationMinutes] = useState('')
  const [location, setLocation] = useState('Kyber Headquarters')
  const [sessionNotes, setSessionNotes] = useState('')

  const [addedExercises, setAddedExercises] = useState<ExerciseInput[]>([])

  // Modal State for custom exercise
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('strength')
  const [customUnit, setCustomUnit] = useState('kg')

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // 1. Fetch user role
      getCurrentUserProfile()
        .then((res) => {
          if (res && res.authenticated) {
            setRole(res.user.role)
            
            // 2. Fetch exercises
            getExercisesList()
              .then((exs) => setExercisesList(exs || []))
              .catch(() => {})

            // 3. If trainer, fetch clients
            if (res.user.role === 'trainer') {
              getTrainerClientsList()
                .then((clients) => {
                  const active = clients?.filter((c: any) => c.status === 'active') || []
                  setClientsList(active)
                })
                .catch(() => {})
            }
            setLoading(false)
          }
        })
        .catch(() => setLoading(false))
    }
  }, [isLoaded, isSignedIn])

  const handleAddExercise = (ex: any) => {
    const newEx: ExerciseInput = {
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      defaultUnit: ex.defaultUnit || 'kg',
      notes: '',
      orderIndex: addedExercises.length,
      sets: [
        {
          setNumber: 1,
          reps: ex.category === 'cardio' ? '' : '10',
          weight: ex.category === 'cardio' ? '' : '60',
          durationSeconds: ex.category === 'cardio' ? '600' : '',
          distance: ex.category === 'cardio' ? '1.5' : '',
          restSeconds: '60',
          intensity: '',
          notes: '',
        }
      ]
    }
    setAddedExercises([...addedExercises, newEx])
    setSearchQuery('')
  }

  const handleRemoveExercise = (idx: number) => {
    const updated = addedExercises.filter((_, i) => i !== idx)
    // Recalculate order indices
    const normalized = updated.map((ex, i) => ({ ...ex, orderIndex: i }))
    setAddedExercises(normalized)
  }

  const handleAddSet = (exIdx: number) => {
    const ex = addedExercises[exIdx]
    const lastSet = ex.sets[ex.sets.length - 1]
    const newSet: SetInput = {
      setNumber: ex.sets.length + 1,
      // copy previous set specs for convenience
      reps: lastSet?.reps || '10',
      weight: lastSet?.weight || '60',
      durationSeconds: lastSet?.durationSeconds || '',
      distance: lastSet?.distance || '',
      restSeconds: lastSet?.restSeconds || '60',
      intensity: lastSet?.intensity || '',
      notes: '',
    }
    const updated = [...addedExercises]
    updated[exIdx].sets.push(newSet)
    setAddedExercises(updated)
  }

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...addedExercises]
    updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx)
    // Re-index set numbers
    updated[exIdx].sets = updated[exIdx].sets.map((set, i) => ({ ...set, setNumber: i + 1 }))
    setAddedExercises(updated)
  }

  const handleSetChange = (exIdx: number, setIdx: number, field: keyof SetInput, value: string) => {
    const updated = [...addedExercises]
    updated[exIdx].sets[setIdx] = {
      ...updated[exIdx].sets[setIdx],
      [field]: value
    }
    setAddedExercises(updated)
  }

  const handleCreateCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName) return

    try {
      const res = await createCustomExercise({
        data: {
          name: customName,
          category: customCategory,
          defaultUnit: customUnit,
        }
      })
      if (res && res.success) {
        const newEx = {
          id: res.exerciseId,
          name: customName,
          category: customCategory,
          defaultUnit: customUnit,
        }
        setExercisesList([newEx, ...exercisesList])
        handleAddExercise(newEx)
        
        // reset custom modal
        setCustomName('')
        setShowCustomModal(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async () => {
    if (addedExercises.length === 0) {
      setError('Please add at least one exercise to the training session.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload: any = {
        title,
        sessionDate,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        location: location || undefined,
        notes: sessionNotes || undefined,
        clientId: selectedClientId || undefined,
        exercises: addedExercises.map(ex => ({
          exerciseId: ex.exerciseId,
          notes: ex.notes || undefined,
          orderIndex: ex.orderIndex,
          sets: ex.sets.map(s => ({
            setNumber: s.setNumber,
            reps: s.reps ? parseInt(s.reps) : undefined,
            weight: s.weight ? parseFloat(s.weight) : undefined,
            durationSeconds: s.durationSeconds ? parseInt(s.durationSeconds) : undefined,
            distance: s.distance ? parseFloat(s.distance) : undefined,
            restSeconds: s.restSeconds ? parseInt(s.restSeconds) : undefined,
            intensity: s.intensity || undefined,
            notes: s.notes || undefined,
          }))
        }))
      }

      await saveWorkoutSession({ data: payload })
      navigate({ to: '/workouts' })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to save workout session.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">Initializing telemetry console...</p>
      </div>
    )
  }

  const filteredExercises = exercisesList.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      {/* Detail Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="chip chip-cyan mb-1">BIOMETRIC TRACKING CORE</div>
          <h1 className="headline-lg font-black text-white m-0">LOG TRAINING SESSION</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate({ to: '/workouts' })} className="btn btn-secondary py-2">Cancel</button>
          <button onClick={handleSave} disabled={saving} className={`btn btn-primary py-2 ${saving ? 'btn-disabled' : ''}`}>
            {saving ? 'Syncing Session...' : 'Sync Session Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-950/40 border border-red-900 text-red-300 body-md">
          {error}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Session Configurations & Search */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Trainer Client Selection */}
          {role === 'trainer' && (
            <div className="card space-y-4">
              <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--secondary-container)]">assignment_ind</span>
                Coaching Designation
              </h3>
              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">Select Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
                >
                  <option value="">Self (Personal workout)</option>
                  {clientsList.map(c => (
                    <option key={c.client.id} value={c.client.id}>{c.client.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Session details */}
          <div className="card space-y-4">
            <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary-container)]">tune</span>
              Session Parameters
            </h3>
            
            <div className="input-group">
              <label className="label-md text-xs text-[var(--on-surface-variant)]">Session Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g. Upper Body Hypertrophy"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">Date</label>
                <DatePicker
                  value={sessionDate}
                  onChange={setSessionDate}
                />
              </div>
              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">Duration (min)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 60"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label-md text-xs text-[var(--on-surface-variant)]">Gym / Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
                placeholder="e.g. Golds Gym"
              />
            </div>

            <div className="input-group">
              <label className="label-md text-xs text-[var(--on-surface-variant)]">Overall Session Notes</label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="input-field min-h-[60px]"
                placeholder="Overall feeling, hydration status..."
              />
            </div>
          </div>

          {/* Exercise Search & Quick Create */}
          <div className="card space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary-container)]">search</span>
                Add Exercise
              </h3>
              <button 
                type="button" 
                onClick={() => setShowCustomModal(true)} 
                className="btn btn-secondary py-0.5 px-2 text-[10px]"
              >
                + Custom
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise..."
              className="input-field w-full"
            />

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {filteredExercises.length === 0 ? (
                <p className="body-md text-xs text-[var(--on-surface-variant)] text-center py-4">No matching exercises. Click "+ Custom" to create one.</p>
              ) : (
                filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleAddExercise(ex)}
                    className="w-full flex justify-between items-center p-2.5 rounded-md hover:bg-white/[0.04] text-left border border-white/5 transition-all text-xs text-white"
                  >
                    <span>{ex.name}</span>
                    <span className="chip py-0 px-2 text-[8px]">{ex.category}</span>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Panel: Exercises Added Editor */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="headline-md text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--primary-container)]">fitness_center</span>
            Training Volume Editor
          </h3>

          {addedExercises.length === 0 ? (
            <div className="card text-center py-20 border-dashed">
              <span className="material-symbols-outlined text-white/10 text-5xl mb-2">playlist_add</span>
              <p className="body-md text-[var(--on-surface-variant)]">No exercises added yet. Use the sidebar search panel to populate your training session.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {addedExercises.map((ex, exIdx) => (
                <div key={exIdx} className="card space-y-4 relative">
                  {/* Remove Exercise Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="absolute top-4 right-4 text-white/40 hover:text-red-400 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>

                  {/* Header */}
                  <div className="border-b border-white/5 pb-2 pr-8 flex items-center gap-2">
                    <span className="chip py-0 px-2 text-[8px] bg-white/5 border-white/10 text-white/50">EX #{exIdx + 1}</span>
                    <h4 className="headline-md font-bold text-white text-base m-0">{ex.name}</h4>
                    <span className="chip chip-cyan py-0.5 px-2 text-[8px]">{ex.category}</span>
                  </div>

                  {/* Individual Exercise Notes */}
                  <div className="input-group">
                    <input
                      type="text"
                      value={ex.notes}
                      onChange={(e) => {
                        const updated = [...addedExercises]
                        updated[exIdx].notes = e.target.value
                        setAddedExercises(updated)
                      }}
                      className="input-field py-1 text-xs"
                      placeholder="Add exercise-specific notes (e.g., bar weight included, band color...)"
                    />
                  </div>

                  {/* Sets inputs */}
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[var(--on-surface-variant)]">
                        <th className="py-2 w-10">Set</th>
                        {ex.category === 'cardio' ? (
                          <>
                            <th className="py-2 w-28">Duration (sec)</th>
                            <th className="py-2 w-28">Distance ({ex.defaultUnit})</th>
                          </>
                        ) : (
                          <>
                            <th className="py-2 w-24">Reps</th>
                            <th className="py-2 w-28">Weight ({ex.defaultUnit})</th>
                          </>
                        )}
                        <th className="py-2 w-24">Rest (sec)</th>
                        <th className="py-2 w-24">Intensity</th>
                        <th className="py-2">Set Notes</th>
                        <th className="py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((set, setIdx) => (
                        <tr key={setIdx} className="border-b border-white/[0.01]">
                          <td className="py-2 font-bold text-white text-center">#{set.setNumber}</td>
                          
                          {ex.category === 'cardio' ? (
                            <>
                              <td className="py-1">
                                <input
                                  type="number"
                                  value={set.durationSeconds}
                                  onChange={(e) => handleSetChange(exIdx, setIdx, 'durationSeconds', e.target.value)}
                                  className="input-field py-1 px-2 text-xs w-20 text-center"
                                  placeholder="secs"
                                />
                              </td>
                              <td className="py-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={set.distance}
                                  onChange={(e) => handleSetChange(exIdx, setIdx, 'distance', e.target.value)}
                                  className="input-field py-1 px-2 text-xs w-20 text-center"
                                  placeholder="dist"
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-1">
                                <input
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) => handleSetChange(exIdx, setIdx, 'reps', e.target.value)}
                                  className="input-field py-1 px-2 text-xs w-16 text-center"
                                  placeholder="reps"
                                />
                              </td>
                              <td className="py-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={set.weight}
                                  onChange={(e) => handleSetChange(exIdx, setIdx, 'weight', e.target.value)}
                                  className="input-field py-1 px-2 text-xs w-20 text-center"
                                  placeholder="kg"
                                />
                              </td>
                            </>
                          )}

                          <td className="py-1">
                            <input
                              type="number"
                              value={set.restSeconds}
                              onChange={(e) => handleSetChange(exIdx, setIdx, 'restSeconds', e.target.value)}
                              className="input-field py-1 px-2 text-xs w-16 text-center"
                              placeholder="secs"
                            />
                          </td>
                          <td className="py-1">
                            <input
                              type="text"
                              value={set.intensity}
                              onChange={(e) => handleSetChange(exIdx, setIdx, 'intensity', e.target.value)}
                              className="input-field py-1 px-2 text-xs w-16 text-center"
                              placeholder="RPE/pace"
                            />
                          </td>
                          <td className="py-1">
                            <input
                              type="text"
                              value={set.notes}
                              onChange={(e) => handleSetChange(exIdx, setIdx, 'notes', e.target.value)}
                              className="input-field py-1 px-2 text-xs w-full"
                              placeholder="Warmup, drop set..."
                            />
                          </td>
                          <td className="py-1 text-center">
                            {ex.sets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(exIdx, setIdx)}
                                className="text-white/20 hover:text-red-400 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    type="button"
                    onClick={() => handleAddSet(exIdx)}
                    className="btn btn-secondary py-1 w-full text-xs"
                  >
                    <span className="material-symbols-outlined text-sm mr-1">add</span>
                    Add Set
                  </button>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Custom Exercise Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card max-w-md w-full p-6 border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="headline-md text-lg font-bold text-white">Create Custom Exercise</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-white/40 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateCustomExercise} className="space-y-4">
              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">Exercise Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Incline Dumbbell Bench Press"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label-md text-xs text-[var(--on-surface-variant)]">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="input-field bg-[var(--surface-container-lowest)] text-white text-xs"
                  >
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="bodyweight">Bodyweight</option>
                    <option value="mobility">Mobility</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="label-md text-xs text-[var(--on-surface-variant)]">Default Unit</label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="input-field bg-[var(--surface-container-lowest)] text-white text-xs"
                  >
                    <option value="kg">kg (weight)</option>
                    <option value="lbs">lbs (weight)</option>
                    <option value="km">km (cardio)</option>
                    <option value="miles">miles (cardio)</option>
                    <option value="m">meters (cardio)</option>
                    <option value="reps">reps (bodyweight)</option>
                    <option value="seconds">seconds (duration)</option>
                    <option value="minutes">minutes (duration)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full py-2.5 text-xs">
                Save & Add Exercise
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
