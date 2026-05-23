import { useUser } from '@clerk/tanstack-start'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
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
  const [status, setStatus] = useState('')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  )

  const refreshNotifications = async () => {
    const list = await getNotifications()
    setNotifications(list || [])
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      navigate({ to: '/sign-in' })
      return
    }

    getCurrentUserProfile()
      .then((profile) => {
        if (!profile?.onboarded) {
          navigate({ to: '/onboarding' })
          return
        }

        refreshNotifications()
          .catch(() => setStatus('Unable to load notifications.'))
          .finally(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [isLoaded, isSignedIn])

  const handleMarkRead = async (notificationId: string) => {
    await markNotificationRead({ data: { notificationId } })
    await refreshNotifications()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    await refreshNotifications()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">
          Loading inbox transmissions...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="chip chip-cyan mb-1">IN-APP INBOX</div>
          <h1 className="headline-lg font-black text-white m-0">NOTIFICATIONS</h1>
          <p className="body-md text-[var(--on-surface-variant)] text-xs mt-1">
            {unreadCount} unread / {notifications.length} total transmissions
          </p>
        </div>
        <button className="btn btn-secondary" disabled={unreadCount === 0} onClick={handleMarkAllRead}>
          Mark All Read
        </button>
      </div>

      {status && (
        <div className="p-3 text-xs rounded bg-red-950/40 border border-red-900 text-red-300">
          {status}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <span className="material-symbols-outlined text-white/10 text-6xl mb-4">
            notifications
          </span>
          <h2 className="headline-md font-bold text-white text-xl">Inbox clear</h2>
          <p className="body-md text-[var(--on-surface-variant)] max-w-md mx-auto mt-2">
            Trainer invites and program assignments will appear here when there is something new to
            review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card p-4 border ${
                notification.readAt
                  ? 'border-white/5 bg-white/[0.01]'
                  : 'border-[var(--primary-container)] bg-white/[0.03]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!notification.readAt && (
                      <span className="h-2 w-2 rounded-full bg-[var(--primary-container)]"></span>
                    )}
                    <span className="chip py-0.5 px-2 text-[8px]">{notification.type}</span>
                    <span className="text-[10px] text-[var(--on-surface-variant)]">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="headline-md text-white font-bold text-base mt-3 mb-1">
                    {notification.title}
                  </h2>
                  <p className="body-md text-[var(--on-surface-variant)] text-sm m-0">
                    {notification.body}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {notification.actionUrl && (
                    <a href={notification.actionUrl} className="btn btn-primary py-1.5 px-3 text-xs">
                      Open
                    </a>
                  )}
                  {!notification.readAt && (
                    <button
                      type="button"
                      className="btn btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => handleMarkRead(notification.id)}
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
