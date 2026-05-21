import { createFileRoute, Link } from '@tanstack/react-router'
import { SignedIn, SignedOut } from '@clerk/tanstack-start'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 max-w-4xl mx-auto">
      {/* Visual background elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--primary-container)]/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[var(--secondary-container)]/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="chip mb-6 animate-pulse">KINETIC PERFORMANCE SYSTEM</div>
      
      <h1 className="display-lg font-black tracking-tight text-white mb-6 leading-tight">
        ELEVATE YOUR ATHLETIC <br />
        <span className="text-[var(--primary-container)]">POTENTIAL.</span>
      </h1>
      
      <p className="body-lg text-[var(--on-surface-variant)] max-w-2xl mb-10 leading-relaxed">
        The unified fitness dashboard for high-performance individuals and professional coaches. Log workouts, sync metrics, and manage coaching networks with radical precision.
      </p>

      {/* Render when Signed Out */}
      <SignedOut>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/sign-up" className="btn btn-primary px-8 py-3">
            Get Started Free
          </Link>
          <Link to="/sign-in" className="btn btn-secondary px-8 py-3">
            Open App Portal
          </Link>
        </div>
      </SignedOut>

      {/* Render when Signed In */}
      <SignedIn>
        <div className="flex flex-col items-center gap-4">
          <div className="card max-w-md p-6 border-white/5 bg-white/[0.02] backdrop-blur">
            <h3 className="headline-md font-bold mb-2">Welcome Back!</h3>
            <p className="body-md text-[var(--on-surface-variant)] mb-4">Your performance portal is active. View your training schedule and records.</p>
            <Link to="/dashboard" className="btn btn-primary w-full">
              Enter Dashboard
            </Link>
          </div>
        </div>
      </SignedIn>

      {/* Feature grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 text-left">
        <div className="card">
          <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl mb-3">fitness_center</span>
          <h4 className="headline-md font-bold mb-2 text-white text-lg">Hyper Logger</h4>
          <p className="body-md text-[var(--on-surface-variant)] text-sm">
            Track individual strength sets, reps, weight, rest timers, and cardio distance and pace in real-time.
          </p>
        </div>
        <div className="card">
          <span className="material-symbols-outlined text-[var(--secondary-container)] text-3xl mb-3">groups</span>
          <h4 className="headline-md font-bold mb-2 text-white text-lg">Coach Sync</h4>
          <p className="body-md text-[var(--on-surface-variant)] text-sm">
            Trainers invite clients via email, verify active permissions, and record custom programs on their clients behalf.
          </p>
        </div>
        <div className="card">
          <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl mb-3">monitoring</span>
          <h4 className="headline-md font-bold mb-2 text-white text-lg">Bio Analytics</h4>
          <p className="body-md text-[var(--on-surface-variant)] text-sm">
            Log weight and resting heart rate metrics, tracking progress curves with beautiful custom SVG dashboards.
          </p>
        </div>
      </div>
    </div>
  )
}
