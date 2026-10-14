import { Link } from '@tanstack/react-router'
import type { UserRecord } from '../types/domain'

interface MobileBottomDockProps {
  dbUser: UserRecord | null
  receivedNotifications?: number
}

export default function MobileBottomDock({
  dbUser,
  receivedNotifications = 0,
}: MobileBottomDockProps) {
  const isTrainer = dbUser?.role === 'trainer'

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#0D1018]/92 backdrop-blur-xl border-t border-white/10 px-3 py-2 shadow-[0_-10px_35px_rgba(0,0,0,0.6)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center text-center">
        {/* 1. Dashboard */}
        <Link
          to="/dashboard"
          className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-white transition group"
          activeProps={{
            className: 'flex flex-col items-center justify-center py-1 text-[#D4FF00] font-bold',
          }}
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">
            dashboard
          </span>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Home</span>
        </Link>

        {/* 2. Workouts (Core Action) */}
        <Link
          to="/workouts"
          className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-white transition group"
          activeProps={{
            className: 'flex flex-col items-center justify-center py-1 text-[#D4FF00] font-bold',
          }}
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">
            fitness_center
          </span>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Train</span>
        </Link>

        {/* 3. Role-specific: Programs/Clients */}
        {isTrainer ? (
          <Link
            to="/clients"
            className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-white transition group"
            activeProps={{
              className: 'flex flex-col items-center justify-center py-1 text-[#00F0FF] font-bold',
            }}
          >
            <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">
              groups
            </span>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">Clients</span>
          </Link>
        ) : (
          <Link
            to="/programs"
            className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-white transition group"
            activeProps={{
              className: 'flex flex-col items-center justify-center py-1 text-[#00F0FF] font-bold',
            }}
          >
            <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">
              assignment
            </span>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">Plans</span>
          </Link>
        )}

        {/* 4. Health Biometrics */}
        <Link
          to="/health"
          className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-white transition group"
          activeProps={{
            className: 'flex flex-col items-center justify-center py-1 text-[#00F0FF] font-bold',
          }}
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">
            monitoring
          </span>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Vitals</span>
        </Link>

        {/* 5. Settings / Notifications */}
        <Link
          to="/settings"
          className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-white transition group relative"
          activeProps={{
            className:
              'flex flex-col items-center justify-center py-1 text-[#D4FF00] font-bold relative',
          }}
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">
            settings
          </span>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Settings</span>
          {receivedNotifications > 0 && (
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
          )}
        </Link>
      </div>
    </nav>
  )
}
