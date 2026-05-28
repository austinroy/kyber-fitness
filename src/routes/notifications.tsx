import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import {
  getCurrentUserProfile,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/actions'
import type { NotificationRecord } from '../types/domain'

export const Route = createFileRoute('/notifications')({
  ssr: false,
  component: NotificationsPage,
})

function NotificationsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      navigate({ to: '/sign-in' })
      return
    }

    getCurrentUserProfile()
      .then((res) => {
        if (!res?.onboarded) {
          navigate({ to: '/onboarding' })
          return
        }
        return loadNotifications(filter)
      })
      .catch(() => {
        setError('Unable to load notification inbox.')
        setLoading(false)
      })
  }, [isLoaded, isSignedIn, filter])

  const loadNotifications = async (mode: 'all' | 'unread') => {
    setLoading(true)
    setError('')
    try {
      const rows = await getNotifications({ data: { unreadOnly: mode === 'unread' } })
      setNotifications(rows || [])
    } catch (err) {
      console.error(err)
      setError('Unable to load notification inbox.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (notificationId: string) => {
    await markNotificationRead({ data: { notificationId } })
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item,
      ),
    )
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    const now = new Date().toISOString()
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || now })))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">Syncing signal inbox...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="chip chip-cyan mb-2">SIGNAL INBOX</div>
          <h1 className="display-lg text-3xl font-black m-0 text-white uppercase">
            Notifications
          </h1>
          <p className="body-md text-[var(--on-surface-variant)] m-0">
            Trainer invites, assigned routines, and coaching alerts land here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-md border border-white/10 overflow-hidden">
            {(['all', 'unread'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`px-4 py-2 text-xs font-bold uppercase ${
                  filter === mode
                    ? 'bg-[var(--secondary-container)] text-black'
                    : 'bg-white/5 text-[var(--on-surface-variant)] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button onClick={handleMarkAllRead} className="btn btn-secondary py-2 text-xs">
            Mark All Read
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-950/40 border border-red-900 text-red-300 body-md">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-white/10 bg-white/[0.01] max-w-2xl mx-auto">
          <span className="material-symbols-outlined text-[var(--secondary-container)] text-5xl mb-4">
            notifications
          </span>
          <h3 className="headline-lg font-black text-white text-xl">Inbox clear</h3>
          <p className="body-md text-[var(--on-surface-variant)] text-sm max-w-md mx-auto mt-2">
            New trainer invites and routine assignments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`card p-5 border ${
                item.readAt
                  ? 'border-white/5 bg-white/[0.02]'
                  : 'border-[var(--secondary-container)] bg-[rgba(0,238,252,0.03)]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {!item.readAt && <span className="chip chip-cyan text-[9px]">UNREAD</span>}
                    <span className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="headline-md text-white font-black text-lg m-0">{item.title}</h3>
                  <p className="body-md text-[var(--on-surface-variant)] text-sm m-0">
                    {item.body}
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.href && (
                    <Link to={item.href} className="btn btn-primary py-2 px-4 text-xs">
                      Open
                    </Link>
                  )}
                  {!item.readAt && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="btn btn-secondary py-2 px-4 text-xs"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
