import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import {
  getCurrentUserProfile,
  getExercisesList,
  createCustomExercise,
  saveWorkoutProgram,
  getWorkoutProgramDetails,
} from '../../lib/actions'
import type { ExerciseRecord, WorkoutProgramDetails } from '../../types/domain'
import type {
  ExerciseInput,
  MoveDirection,
  SaveWorkoutProgramPayload,
  SetInput,
} from '../../types/workout-editor'

export const Route = createFileRoute('/programs/new')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      programId: (search.programId as string) || undefined,
    }
  },
  component: ProgramBuilderPage,
})

function ProgramBuilderPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const programId = search.programId

  // Load baseline states
  const [loading, setLoading] = useState(true)
  const [exercisesList, setExercisesList] = useState<ExerciseRecord[]>([])

  // Form State
  const [title, setTitle] = useState('')
  const [programNotes, setProgramNotes] = useState('')
  const [progressionPlan, setProgressionPlan] = useState('')
  const [addedExercises, setAddedExercises] = useState<ExerciseInput[]>([])

  // Search & custom exercise states
  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('strength')
  const [customUnit, setCustomUnit] = useState('kg')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        navigate({ to: '/sign-in' })
      } else {
        getCurrentUserProfile()
          .then((res) => {
            if (res && res.authenticated) {
              if (!res.onboarded) {
                navigate({ to: '/onboarding' })
              } else if (res.user.role !== 'trainer') {
                navigate({ to: '/dashboard' }) // Individuals cannot build programs
              } else {
                // Fetch exercises list
                getExercisesList()
                  .then((exs) => setExercisesList(exs || []))
                  .catch(() => {})

                // Fetch details if editing
                if (programId) {
                  getWorkoutProgramDetails({ data: { programId } })
                    .then((details: WorkoutProgramDetails) => {
                      setTitle(details.title)
                      setProgramNotes(details.notes || '')
                      setProgressionPlan(details.progressionPlan || '')

                      const mapped = details.exercises.map((ex) => ({
                        exerciseId: ex.exerciseId,
                        name: ex.name,
                        category: ex.category,
                        defaultUnit: ex.defaultUnit || 'kg',
                        notes: ex.notes || '',
                        blockName: ex.blockName || '',
                        orderIndex: ex.orderIndex,
                        sets: ex.sets.map((s) => ({
                          setNumber: s.setNumber,
                          reps: s.reps?.toString() || '',
                          weight: s.weight?.toString() || '',
                          durationSeconds: s.durationSeconds?.toString() || '',
                          distance: s.distance?.toString() || '',
                          restSeconds: s.restSeconds?.toString() || '',
                          intensity: s.intensity || '',
                          notes: s.notes || '',
                        })),
                      }))
                      setAddedExercises(mapped)
                    })
                    .catch((err) => {
                      console.error(err)
                      setError('Failed to load program template.')
                    })
                }

                setLoading(false)
              }
            } else {
              navigate({ to: '/onboarding' })
            }
          })
          .catch(() => setLoading(false))
      }
    }
  }, [isLoaded, isSignedIn, programId])

  const handleAddExercise = (ex: ExerciseRecord) => {
    const newEx: ExerciseInput = {
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      defaultUnit: ex.defaultUnit || 'kg',
      notes: '',
      blockName: '',
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
        },
      ],
    }
    setAddedExercises([...addedExercises, newEx])
    setSearchQuery('')
  }

  const handleRemoveExercise = (idx: number) => {
    const updated = addedExercises.filter((_, i) => i !== idx)
    const normalized = updated.map((ex, i) => ({ ...ex, orderIndex: i }))
    setAddedExercises(normalized)
  }

  const handleMoveExercise = (idx: number, direction: MoveDirection) => {
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === addedExercises.length - 1) return

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    const updated = [...addedExercises]

    // Swap
    const temp = updated[idx]
    updated[idx] = updated[targetIdx]
    updated[targetIdx] = temp

    // Normalize orderIndex
    const normalized = updated.map((ex, i) => ({ ...ex, orderIndex: i }))
    setAddedExercises(normalized)
  }

  const handleAddSet = (exIdx: number) => {
    const ex = addedExercises[exIdx]
    const lastSet = ex.sets[ex.sets.length - 1]
    const newSet: SetInput = {
      setNumber: ex.sets.length + 1,
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
    updated[exIdx].sets = updated[exIdx].sets.map((set, i) => ({ ...set, setNumber: i + 1 }))
    setAddedExercises(updated)
  }

  const handleSetChange = (exIdx: number, setIdx: number, field: keyof SetInput, value: string) => {
    const updated = [...addedExercises]
    updated[exIdx].sets[setIdx] = {
      ...updated[exIdx].sets[setIdx],
      [field]: value,
    }
    setAddedExercises(updated)
  }

  const handleExerciseNotesChange = (exIdx: number, value: string) => {
    const updated = [...addedExercises]
    updated[exIdx].notes = value
    setAddedExercises(updated)
  }

  const handleExerciseBlockChange = (exIdx: number, value: string) => {
    const updated = [...addedExercises]
    updated[exIdx].blockName = value
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
        },
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
        setCustomName('')
        setShowCustomModal(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveProgram = async () => {
    if (!title.trim()) {
      setError('Please provide a title for this program template.')
      return
    }
    if (addedExercises.length === 0) {
      setError('Please add at least one exercise to the program template.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload: SaveWorkoutProgramPayload = {
        programId: programId || undefined,
        title: title.trim(),
        notes: programNotes.trim() || undefined,
        progressionPlan: progressionPlan.trim() || undefined,
        exercises: addedExercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          notes: ex.notes || undefined,
          blockName: ex.blockName || undefined,
          orderIndex: ex.orderIndex,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            reps: s.reps ? parseInt(s.reps) : undefined,
            weight: s.weight ? parseFloat(s.weight) : undefined,
            durationSeconds: s.durationSeconds ? parseInt(s.durationSeconds) : undefined,
            distance: s.distance ? parseFloat(s.distance) : undefined,
            restSeconds: s.restSeconds ? parseInt(s.restSeconds) : undefined,
            intensity: s.intensity || undefined,
            notes: s.notes || undefined,
          })),
        })),
      }

      await saveWorkoutProgram({ data: payload })
      navigate({ to: '/programs' })
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save workout program template.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">
          Streaming program telemetry console...
        </p>
      </div>
    )
  }

  const filteredExercises = exercisesList.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="chip chip-cyan mb-1">STITCH KINETIC ROUTINE BUILDER</div>
          <h1 className="headline-lg font-black text-white m-0 uppercase">
            {programId ? 'Edit Program Template' : 'Design Routine Template'}
          </h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate({ to: '/programs' })} className="btn btn-secondary py-2">
            Cancel
          </button>
          <button
            onClick={handleSaveProgram}
            disabled={saving}
            className={`btn btn-primary py-2 ${saving ? 'btn-disabled' : ''}`}
          >
            {saving ? 'Saving Template...' : 'Save Template'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-950/40 border border-red-900 text-red-300 body-md">
          {error}
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Catalog search & Custom register */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card space-y-4">
            <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary-container)]">
                search
              </span>
              Exercise Catalog
            </h3>

            <div className="input-group">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex justify-between items-center p-3 rounded-md bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                >
                  <div>
                    <p className="body-md font-bold text-white text-sm m-0">{ex.name}</p>
                    <span className="text-[10px] text-[var(--on-surface-variant)] capitalize">
                      {ex.category} • Default {ex.defaultUnit || 'kg'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddExercise(ex)}
                    className="btn py-1 px-2.5 text-xs bg-[var(--primary-container)]/10 hover:bg-[var(--primary-container)]/20 text-[var(--primary-container)] border border-[var(--primary-container)]/20 rounded-md flex items-center"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              ))}
              {filteredExercises.length === 0 && (
                <p className="body-md text-[var(--on-surface-variant)] text-xs text-center py-4">
                  No matching exercises found.
                </p>
              )}
            </div>

            <div className="border-t border-white/5 pt-4">
              <button
                onClick={() => setShowCustomModal(true)}
                className="btn btn-secondary w-full py-2 flex items-center justify-center gap-2 text-xs"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>Register Custom Exercise</span>
              </button>
            </div>

            <div className="input-group">
              <label className="label-md text-xs text-[var(--on-surface-variant)]">
                Progression Plan
              </label>
              <textarea
                placeholder="e.g., Add 2.5kg weekly while RPE stays below 8, then deload after week 4."
                value={progressionPlan}
                onChange={(e) => setProgressionPlan(e.target.value)}
                className="input-field bg-[var(--surface-container-lowest)] text-white w-full min-h-[110px] resize-none"
              />
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--secondary-container)]">
                info
              </span>
              Template Attributes
            </h3>

            <div className="input-group">
              <label className="label-md text-xs text-[var(--on-surface-variant)]">
                Template Title
              </label>
              <input
                type="text"
                placeholder="e.g., Push Day Hypertrophy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
              />
            </div>

            <div className="input-group">
              <label className="label-md text-xs text-[var(--on-surface-variant)]">
                Coaching / Routine Notes
              </label>
              <textarea
                placeholder="Write overall guidelines, hydration, or warm-up notes here..."
                value={programNotes}
                onChange={(e) => setProgramNotes(e.target.value)}
                className="input-field bg-[var(--surface-container-lowest)] text-white w-full min-h-[120px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right column: Routine Constructor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="headline-md text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--secondary-container)]">
                assignment_turned_in
              </span>
              Routine Constructor
            </h3>
            <span className="chip chip-cyan">{addedExercises.length} exercises added</span>
          </div>

          {addedExercises.length === 0 ? (
            <div className="card text-center py-16 border-dashed border-white/10 bg-white/[0.01]">
              <span className="material-symbols-outlined text-[var(--secondary-container)] text-5xl mb-3 animate-pulse">
                playlist_add
              </span>
              <h4 className="headline-md font-bold text-white/70 text-lg">Your canvas is empty</h4>
              <p className="body-md text-[var(--on-surface-variant)] text-sm max-w-sm mx-auto">
                Add exercises from the catalog on the left to structure your premium routine
                template.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {addedExercises.map((ex, exIdx) => (
                <div
                  key={`${ex.exerciseId}-${exIdx}`}
                  className="card p-5 relative overflow-hidden transition-all duration-300 border border-[var(--secondary-container)] shadow-[0_0_15px_rgba(0,238,252,0.05)]"
                >
                  {/* Decorative glowing gradient border indicator */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--secondary-container)]"></div>

                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="chip py-0.5 px-2 text-[10px] bg-white/10 text-white font-bold">
                          {exIdx + 1}
                        </span>
                        <h4 className="headline-md text-white font-black text-lg m-0 uppercase tracking-tight">
                          {ex.name}
                        </h4>
                        <span className="chip chip-cyan py-0.5 px-2 text-[9px] uppercase font-semibold">
                          {ex.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--on-surface-variant)] m-0 mt-1 capitalize">
                        {ex.blockName ? `${ex.blockName} block • ` : ''}Default Unit:{' '}
                        {ex.defaultUnit}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Sort ordering arrows */}
                      <button
                        onClick={() => handleMoveExercise(exIdx, 'up')}
                        disabled={exIdx === 0}
                        className="btn py-1 px-2 text-xs bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 rounded-md"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                      </button>
                      <button
                        onClick={() => handleMoveExercise(exIdx, 'down')}
                        disabled={exIdx === addedExercises.length - 1}
                        className="btn py-1 px-2 text-xs bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 rounded-md"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                      </button>
                      <button
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="btn py-1 px-2 text-xs bg-red-950/40 hover:bg-red-950/80 border border-red-900/40 text-red-400 rounded-md ml-2"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Sets Editor Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                          <th className="py-2 pl-2 w-12 text-center">Set</th>
                          {ex.category !== 'cardio' && <th className="py-2 w-20">Reps</th>}
                          {ex.category !== 'cardio' && (
                            <th className="py-2 w-24">Weight ({ex.defaultUnit})</th>
                          )}
                          {ex.category === 'cardio' && (
                            <th className="py-2 w-24">Duration (sec)</th>
                          )}
                          {ex.category === 'cardio' && (
                            <th className="py-2 w-24">Distance ({ex.defaultUnit})</th>
                          )}
                          <th className="py-2 w-20">Rest (sec)</th>
                          <th className="py-2 w-24">Intensity</th>
                          <th className="py-2 pr-2">Instruction Note</th>
                          <th className="py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((set, setIdx) => (
                          <tr
                            key={setIdx}
                            className="border-b border-white/5 text-sm align-middle hover:bg-white/[0.02]"
                          >
                            <td className="py-2 text-center font-bold text-[var(--secondary-container)] pl-2">
                              {set.setNumber}
                            </td>

                            {ex.category !== 'cardio' && (
                              <td className="py-1">
                                <input
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleSetChange(exIdx, setIdx, 'reps', e.target.value)
                                  }
                                  className="w-16 bg-white/5 text-white border border-white/5 rounded px-2 py-1 text-center text-xs"
                                  placeholder="10"
                                />
                              </td>
                            )}

                            {ex.category !== 'cardio' && (
                              <td className="py-1">
                                <input
                                  type="number"
                                  value={set.weight}
                                  onChange={(e) =>
                                    handleSetChange(exIdx, setIdx, 'weight', e.target.value)
                                  }
                                  className="w-20 bg-white/5 text-white border border-white/5 rounded px-2 py-1 text-center text-xs"
                                  placeholder="60"
                                  step="any"
                                />
                              </td>
                            )}

                            {ex.category === 'cardio' && (
                              <td className="py-1">
                                <input
                                  type="number"
                                  value={set.durationSeconds}
                                  onChange={(e) =>
                                    handleSetChange(
                                      exIdx,
                                      setIdx,
                                      'durationSeconds',
                                      e.target.value,
                                    )
                                  }
                                  className="w-20 bg-white/5 text-white border border-white/5 rounded px-2 py-1 text-center text-xs"
                                  placeholder="600"
                                />
                              </td>
                            )}

                            {ex.category === 'cardio' && (
                              <td className="py-1">
                                <input
                                  type="number"
                                  value={set.distance}
                                  onChange={(e) =>
                                    handleSetChange(exIdx, setIdx, 'distance', e.target.value)
                                  }
                                  className="w-20 bg-white/5 text-white border border-white/5 rounded px-2 py-1 text-center text-xs"
                                  placeholder="1.5"
                                  step="any"
                                />
                              </td>
                            )}

                            <td className="py-1">
                              <input
                                type="number"
                                value={set.restSeconds}
                                onChange={(e) =>
                                  handleSetChange(exIdx, setIdx, 'restSeconds', e.target.value)
                                }
                                className="w-16 bg-white/5 text-white border border-white/5 rounded px-2 py-1 text-center text-xs"
                                placeholder="60"
                              />
                            </td>

                            <td className="py-1">
                              <input
                                type="text"
                                value={set.intensity}
                                onChange={(e) =>
                                  handleSetChange(exIdx, setIdx, 'intensity', e.target.value)
                                }
                                className="w-20 bg-white/5 text-white border border-white/5 rounded px-2 py-1 text-left text-xs"
                                placeholder={ex.category === 'cardio' ? 'Pace' : 'RPE 8'}
                              />
                            </td>

                            <td className="py-1">
                              <input
                                type="text"
                                value={set.notes}
                                onChange={(e) =>
                                  handleSetChange(exIdx, setIdx, 'notes', e.target.value)
                                }
                                className="w-full bg-white/5 text-white border border-white/5 rounded px-2 py-1 text-left text-xs"
                                placeholder="e.g. Slow negative pace"
                              />
                            </td>

                            <td className="py-1 text-right pr-2">
                              {ex.sets.length > 1 && (
                                <button
                                  onClick={() => handleRemoveSet(exIdx, setIdx)}
                                  className="text-red-400 hover:text-red-500 flex items-center justify-center p-1"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add set and specific exercise guidelines */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleAddSet(exIdx)}
                      className="btn py-1 px-3 bg-white/5 hover:bg-white/10 text-white rounded-md text-xs flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      <span>Add Target Set</span>
                    </button>

                    <div className="w-full md:max-w-xl grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Reusable block, e.g. Week 1 Push A"
                        value={ex.blockName}
                        onChange={(e) => handleExerciseBlockChange(exIdx, e.target.value)}
                        className="bg-transparent text-white placeholder-white/20 border-b border-white/5 hover:border-white/15 focus:border-[var(--secondary-container)] w-full py-1 text-xs outline-none transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Exercise specific coaching instructions..."
                        value={ex.notes}
                        onChange={(e) => handleExerciseNotesChange(exIdx, e.target.value)}
                        className="bg-transparent text-white placeholder-white/20 border-b border-white/5 hover:border-white/15 focus:border-[var(--secondary-container)] w-full py-1 text-xs outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Custom Exercise Creator */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-md space-y-6 relative border border-white/10 bg-[#121212] shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="headline-md text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary-container)]">
                  add_box
                </span>
                Register Custom Exercise
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-[var(--on-surface-variant)] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCustomExercise} className="space-y-4">
              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">
                  Exercise Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Barbell Zercher Squat"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
                  required
                />
              </div>

              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">
                  Movement Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
                >
                  <option value="strength">Strength / Hypertrophy</option>
                  <option value="cardio">Cardio / Endurance</option>
                  <option value="bodyweight">Calisthenics / Bodyweight</option>
                  <option value="mobility">Mobility / Flexibility</option>
                </select>
              </div>

              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">
                  Default Metric Unit
                </label>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="km">Kilometers (km)</option>
                  <option value="miles">Miles (mi)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="btn btn-secondary py-1.5 px-4 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary py-1.5 px-4 text-xs">
                  Register and Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
