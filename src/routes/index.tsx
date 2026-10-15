import { createFileRoute, Link } from '@tanstack/react-router'
import { SignedIn, SignedOut } from '@clerk/tanstack-start'
import { useState, useEffect } from 'react'
import {
  Dumbbell,
  Users,
  Activity,
  ShieldCheck,
  Zap,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  Timer,
  CheckCircle2,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  // Interactive Hero State
  const [activePersona, setActivePersona] = useState<'athlete' | 'coach'>('athlete')
  const [weight, setWeight] = useState(140.0)
  const [restSeconds, setRestSeconds] = useState(102) // 01:42
  const [isLogged, setIsLogged] = useState(false)

  // Live timer tick for athletic realism
  useEffect(() => {
    const interval = setInterval(() => {
      setRestSeconds((prev) => (prev > 0 ? prev - 1 : 90))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleAdjustWeight = (delta: number) => {
    setWeight((prev) => Math.max(20, Math.round((prev + delta) * 10) / 10))
  }

  const handleLogSet = () => {
    setIsLogged(true)
    setRestSeconds(90)
    setTimeout(() => setIsLogged(false), 2500)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#D4FF00]/10 via-[#00F0FF]/10 to-transparent rounded-full filter blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[600px] -right-32 w-[450px] h-[450px] bg-[#00F0FF]/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Prop & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 dark:bg-white/[0.04] border border-lime-600/30 dark:border-white/10 text-xs font-mono tracking-wider">
              <span className="w-2 h-2 rounded-full bg-lime-600 dark:bg-[#D4FF00] animate-pulse" />
              <span className="text-lime-700 dark:text-[#D4FF00] font-bold">
                FOR ATHLETES AND COACHES
              </span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              Train hard. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-600 via-emerald-600 to-cyan-600 dark:from-[#D4FF00] dark:via-[#D4FF00] dark:to-[#00F0FF]">
                See the progress.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 max-w-xl leading-relaxed">
              Log every set without slowing down, keep an eye on your weight and heart rate, and
              work with a coach who only sees what you choose to share.
            </p>

            {/* Signed Out CTAs */}
            <SignedOut>
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/sign-up"
                  className="btn btn-primary px-7 py-3.5 text-xs font-black tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(212,255,0,0.35)]"
                >
                  <span>Create an account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/sign-in"
                  className="btn btn-secondary px-6 py-3.5 text-xs font-bold tracking-wider flex items-center gap-2"
                >
                  <span>Sign in</span>
                </Link>
              </div>
            </SignedOut>

            {/* Signed In CTAs */}
            <SignedIn>
              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-md max-w-md space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-[#D4FF00]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Welcome back
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Pick up where you left off. Your workouts and stats are waiting.
                  </p>
                  <Link
                    to="/dashboard"
                    className="btn btn-primary w-full py-2.5 text-xs font-black flex items-center justify-center gap-2"
                  >
                    <span>Go to dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </SignedIn>

            {/* Feature highlights strip */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-white/[0.08] max-w-md text-left">
              <div>
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Sets, reps & RPE
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Strength and cardio
                </div>
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-lime-700 dark:text-[#D4FF00]">
                  Your call
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Coaches need your OK
                </div>
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-cyan-700 dark:text-[#00F0FF]">
                  Trends
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Weight, body fat, resting HR
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dual-Persona Interactive Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-white/95 dark:bg-[#0D1018]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-slate-900 dark:text-white transition-all">
              {/* Persona Tab Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 mb-5 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePersona('athlete')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    activePersona === 'athlete'
                      ? 'bg-[#D4FF00] text-black shadow-md'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Athlete View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePersona('coach')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    activePersona === 'coach'
                      ? 'bg-[#00F0FF] text-black shadow-md'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Coach View</span>
                </button>
              </div>

              {/* ATHLETE VIEW CONTENT */}
              {activePersona === 'athlete' ? (
                <div className="space-y-4">
                  {/* Active Exercise Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-[#00F0FF] uppercase tracking-wider">
                        Squat day &bull; Set 4 of 5
                      </span>
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        Barbell Back Squat
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-lime-500/15 text-lime-800 dark:text-[#D4FF00] border border-lime-600/30 dark:border-[#D4FF00]/30">
                      SET 4 / 5
                    </span>
                  </div>

                  {/* 3 Metric Readout Columns */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Weight with quick adjust buttons */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center flex flex-col justify-between">
                      <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 font-semibold">
                        WEIGHT
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums my-1">
                        {weight.toFixed(1)}
                        <span className="text-xs font-normal text-slate-500 dark:text-zinc-400 ml-0.5">
                          kg
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustWeight(-2.5)}
                          className="w-6 h-6 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white flex items-center justify-center text-xs font-bold transition"
                          title="Decrease 2.5kg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustWeight(2.5)}
                          className="w-6 h-6 rounded-lg bg-lime-500/20 hover:bg-lime-500/30 text-lime-800 dark:bg-[#D4FF00]/20 dark:hover:bg-[#D4FF00]/40 dark:text-[#D4FF00] flex items-center justify-center text-xs font-bold transition"
                          title="Increase 2.5kg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Reps */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center flex flex-col justify-between">
                      <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 font-semibold">
                        TARGET
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums my-1">
                        5
                        <span className="text-xs font-normal text-slate-500 dark:text-zinc-400 ml-0.5">
                          reps
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 pb-1">
                        RPE 8.5
                      </div>
                    </div>

                    {/* Live Rest Timer */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center flex flex-col justify-between">
                      <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 font-semibold">
                        REST
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-cyan-700 dark:text-[#00F0FF] tabular-nums my-1 flex items-center justify-center gap-1">
                        <Timer className="w-4 h-4 text-cyan-700 dark:text-[#00F0FF] animate-pulse" />
                        <span>{formatTimer(restSeconds)}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 pb-1">
                        TIMER
                      </div>
                    </div>
                  </div>

                  {/* PR Milestone Alert */}
                  <div className="p-3 rounded-2xl bg-lime-500/10 dark:bg-[#D4FF00]/10 border border-lime-600/25 dark:border-[#D4FF00]/25 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-lime-700 dark:text-[#D4FF00]" />
                      <span className="font-extrabold text-lime-800 dark:text-[#D4FF00]">
                        NEW PERSONAL RECORD!
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 dark:text-zinc-300 font-semibold">
                      +5.0 kg today
                    </span>
                  </div>

                  {/* Quick Action Button */}
                  <button
                    type="button"
                    onClick={handleLogSet}
                    className="w-full py-3 rounded-xl bg-[#D4FF00] hover:bg-[#c6f000] text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(212,255,0,0.3)] flex items-center justify-center gap-2"
                  >
                    {isLogged ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-black" />
                        <span>SET 4 LOGGED &bull; RESTING FOR 90S</span>
                      </>
                    ) : (
                      <>
                        <span>LOG SET 4 &bull; START 90S REST</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* COACH VIEW CONTENT */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-[#00F0FF] uppercase tracking-wider">
                        YOUR CLIENTS
                      </span>
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        Active Athletes (8)
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                      CONNECTED
                    </span>
                  </div>

                  {/* Client Item 1 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-white font-mono text-xs font-bold flex items-center justify-center">
                          SJ
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Sarah Jenkins
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Hypertrophy Phase &bull; Week 3 of 6
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                        COMPLETED TODAY
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 text-[11px] text-slate-800 dark:text-zinc-300 flex items-center justify-between shadow-xs">
                      <span>Squat: 105 kg &times; 5 reps</span>
                      <span className="font-mono text-lime-700 dark:text-[#D4FF00] font-bold">
                        RPE 9.0
                      </span>
                    </div>
                  </div>

                  {/* Client Item 2 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-white font-mono text-xs font-bold flex items-center justify-center">
                          DK
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            David Kim
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Marathon Prep &bull; Block 2
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        DUE TOMORROW
                      </span>
                    </div>
                  </div>

                  {/* Coach Action */}
                  <Link
                    to="/programs"
                    className="w-full py-3 rounded-xl bg-[#00F0FF] hover:bg-[#3bf4ff] text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2"
                  >
                    <span>ASSIGN A WORKOUT PROGRAM</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3 CORE PILLARS SECTION */}
      {/* ========================================================================= */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-200 dark:border-white/[0.08]"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="chip chip-lime mb-2">HOW IT WORKS</div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            EVERYTHING YOU NEED TO TRAIN AND COACH
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2">
            Fast enough to use between heavy sets, detailed enough for coaches who want real
            insight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Pillar 1 */}
          <div className="card p-6 space-y-4 hover:border-lime-500/50 dark:hover:border-[#D4FF00]/40 transition group">
            <div className="w-12 h-12 rounded-2xl bg-lime-500/10 dark:bg-[#D4FF00]/10 border border-lime-500/20 dark:border-[#D4FF00]/20 flex items-center justify-center text-lime-700 dark:text-[#D4FF00] group-hover:scale-105 transition shadow-[0_0_15px_rgba(132,204,22,0.15)] dark:shadow-[0_0_15px_rgba(212,255,0,0.15)]">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tight">
              Fast workout logging
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Track sets, reps, weight in kg or lbs, RPE, and rest times in seconds without breaking
              your rhythm in the gym.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono font-bold text-lime-700 dark:text-[#D4FF00]">
              <span>QUICK & FRICTIONLESS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 2 */}
          <div
            id="coaching"
            className="card p-6 space-y-4 hover:border-cyan-500/50 dark:hover:border-[#00F0FF]/40 transition group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-[#00F0FF]/10 border border-cyan-500/20 dark:border-[#00F0FF]/20 flex items-center justify-center text-cyan-700 dark:text-[#00F0FF] group-hover:scale-105 transition shadow-[0_0_15px_rgba(6,182,212,0.15)] dark:shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tight">
              Coaching with consent
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              You stay in control of your data. Coaches only see your workouts and body stats when
              you explicitly allow it.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono font-bold text-cyan-700 dark:text-[#00F0FF]">
              <span>CLEAR PERMISSIONS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 3 */}
          <div
            id="telemetry"
            className="card p-6 space-y-4 hover:border-lime-500/50 dark:hover:border-[#D4FF00]/40 transition group"
          >
            <div className="w-12 h-12 rounded-2xl bg-lime-500/10 dark:bg-[#D4FF00]/10 border border-lime-500/20 dark:border-[#D4FF00]/20 flex items-center justify-center text-lime-700 dark:text-[#D4FF00] group-hover:scale-105 transition shadow-[0_0_15px_rgba(132,204,22,0.15)] dark:shadow-[0_0_15px_rgba(212,255,0,0.15)]">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tight">
              Progress & body stats
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Watch your strength climb and track your weight, body fat, and resting heart rate over
              time with clear charts.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono font-bold text-lime-700 dark:text-[#D4FF00]">
              <span>HELPFUL CHARTS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TELEMETRY SHOWCASE SECTION (GLOWING AREA CHART) */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="card p-6 sm:p-8 relative overflow-hidden bg-white/95 dark:bg-gradient-to-b dark:from-[#111622]/90 dark:to-[#0A0D14]/90 border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-[#00F0FF] animate-pulse" />
                <span className="text-[11px] font-mono text-cyan-700 dark:text-[#00F0FF] font-bold tracking-wider uppercase">
                  PROGRESS OVER TIME
                </span>
              </div>
              <h3 className="font-display font-black text-2xl text-slate-900 dark:text-white tracking-tight mt-1">
                Body weight & strength trends
              </h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300">
                SQUAT:{' '}
                <span className="text-lime-700 dark:text-[#D4FF00] font-bold">
                  +12.5% THIS MONTH
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300">
                TREND:{' '}
                <span className="text-cyan-700 dark:text-[#00F0FF] font-bold">STEADY GAINS</span>
              </div>
            </div>
          </div>

          {/* SVG Glow Area Chart */}
          <div className="relative h-44 sm:h-56 w-full pt-4">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 160"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="landingCyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-cyan)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--chart-cyan)" stopOpacity="0.0" />
                </linearGradient>
                <filter id="landingGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Lines */}
              <line
                x1="0"
                y1="40"
                x2="700"
                y2="40"
                stroke="var(--chart-grid)"
                strokeDasharray="4,4"
              />
              <line
                x1="0"
                y1="80"
                x2="700"
                y2="80"
                stroke="var(--chart-grid)"
                strokeDasharray="4,4"
              />
              <line
                x1="0"
                y1="120"
                x2="700"
                y2="120"
                stroke="var(--chart-grid)"
                strokeDasharray="4,4"
              />

              {/* Area Fill */}
              <path
                d="M 0 130 Q 120 120, 220 90 T 450 70 T 700 35 L 700 160 L 0 160 Z"
                fill="url(#landingCyanGrad)"
              />

              {/* Glowing Line */}
              <path
                d="M 0 130 Q 120 120, 220 90 T 450 70 T 700 35"
                fill="none"
                stroke="var(--chart-cyan)"
                strokeWidth="3"
                className="drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]"
              />

              {/* Data points */}
              <circle cx="220" cy="90" r="4" fill="var(--chart-cyan)" />
              <circle cx="450" cy="70" r="4" fill="var(--chart-cyan)" />
              <circle
                cx="700"
                cy="35"
                r="7"
                fill="var(--chart-volt)"
                stroke="var(--chart-dot-bg)"
                strokeWidth="2.5"
                className="animate-pulse"
              />
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-500 pt-3 border-t border-slate-200 dark:border-white/5">
            <span>WEEK 1</span>
            <span>WEEK 2</span>
            <span>WEEK 3</span>
            <span className="text-lime-700 dark:text-[#D4FF00] font-bold">
              WEEK 4 &bull; NEW PR
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CALL TO ACTION STRIP */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="card p-8 sm:p-12 relative overflow-hidden bg-gradient-to-tr from-lime-500/10 via-white to-cyan-500/10 dark:from-[#D4FF00]/10 dark:via-transparent dark:to-[#00F0FF]/10 border-slate-200 dark:border-white/15">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 dark:bg-black/40 border border-lime-600/30 dark:border-[#D4FF00]/30 text-xs font-mono font-bold text-lime-700 dark:text-[#D4FF00] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>JOIN KYBER</span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight mb-4">
            READY TO START TRACKING?
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Free for individual athletes. Built to help coaches stay organized. Start logging your
            workouts in minutes.
          </p>

          <SignedOut>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/sign-up"
                className="btn btn-primary px-8 py-3.5 text-xs font-black tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(212,255,0,0.35)]"
              >
                <span>SIGN UP FREE</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/sign-in"
                className="btn btn-secondary px-7 py-3.5 text-xs font-bold tracking-wider"
              >
                SIGN IN
              </Link>
            </div>
          </SignedOut>

          <SignedIn>
            <Link
              to="/dashboard"
              className="btn btn-primary px-8 py-3.5 text-xs font-black tracking-wider inline-flex items-center gap-2"
            >
              <span>GO TO DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedIn>
        </div>
      </section>
    </div>
  )
}
