import { useEffect, useSyncExternalStore } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CheckCircle2, CircleAlert, CircleX, Info, LoaderCircle, X } from 'lucide-react'
import { alpha, styled } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

export type ToastType = 'default' | 'success' | 'info' | 'warning' | 'error' | 'loading'
export type ToastPriority = 'high' | 'normal' | 'low'

export interface ToastActionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  children: ReactNode
}

export interface ToastOptions {
  title?: ReactNode
  description?: ReactNode
  type?: ToastType
  priority?: ToastPriority
  actionProps?: ToastActionProps
  duration?: number
}

type ToastState = 'open' | 'closing'

interface ToastRecord extends Required<Pick<ToastOptions, 'type' | 'priority' | 'duration'>> {
  id: string
  title?: ReactNode
  description?: ReactNode
  actionProps?: ToastActionProps
  state: ToastState
}

type ToastPromiseContent<T> = string | ToastOptions | ((value: T) => string | ToastOptions)

export interface ToastPromiseMessages<T> {
  loading: ToastPromiseContent<void>
  success: ToastPromiseContent<T>
  error: ToastPromiseContent<unknown>
}

const toastDuration = 4000
const exitDuration = 220
const priorityOrder: Record<ToastPriority, number> = { high: 0, normal: 1, low: 2 }
let toastCounter = 0
let toastRecords: ToastRecord[] = []
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getToastRecords = () => toastRecords

const publish = () => {
  listeners.forEach((listener) => listener())
}

const sortToasts = (records: ToastRecord[]) =>
  [...records].sort((first, second) => priorityOrder[first.priority] - priorityOrder[second.priority])

const closeToast = (id: string) => {
  const currentToast = toastRecords.find((item) => item.id === id)
  if (!currentToast || currentToast.state === 'closing') return

  toastRecords = toastRecords.map((item) => (item.id === id ? { ...item, state: 'closing' } : item))
  publish()

  window.setTimeout(() => {
    toastRecords = toastRecords.filter((item) => item.id !== id)
    publish()
  }, exitDuration)
}

const resolvePromiseContent = <T,>(content: ToastPromiseContent<T>, value: T): ToastOptions => {
  const resolvedContent = typeof content === 'function' ? content(value) : content
  return typeof resolvedContent === 'string' ? { description: resolvedContent } : resolvedContent
}

export const toast = {
  add(options: ToastOptions) {
    const id = `toast-${++toastCounter}`
    const record: ToastRecord = {
      id,
      type: options.type ?? 'default',
      priority: options.priority ?? 'normal',
      duration: options.duration ?? toastDuration,
      title: options.title,
      description: options.description,
      actionProps: options.actionProps,
      state: 'open',
    }

    toastRecords = sortToasts([record, ...toastRecords])
    publish()
    return id
  },

  close(id: string) {
    closeToast(id)
  },

  update(id: string, options: ToastOptions) {
    const currentToast = toastRecords.find((item) => item.id === id)
    if (!currentToast || currentToast.state === 'closing') return

    toastRecords = toastRecords.map((item) =>
      item.id === id
        ? {
            ...item,
            ...options,
            type: options.type ?? item.type,
            priority: options.priority ?? item.priority,
            duration: options.duration ?? toastDuration,
          }
        : item
    )
    toastRecords = sortToasts(toastRecords)
    publish()
  },

  promise<T>(promise: Promise<T>, messages: ToastPromiseMessages<T>) {
    const id = this.add({ ...resolvePromiseContent(messages.loading, undefined), type: 'loading', duration: Infinity })

    promise.then(
      (value) => {
        this.update(id, { ...resolvePromiseContent(messages.success, value), type: 'success' })
      },
      (error: unknown) => {
        this.update(id, { ...resolvePromiseContent(messages.error, error), type: 'error', priority: 'high' })
      }
    )

    return promise
  },
}

const toneColor = (theme: Theme, type: ToastType) => {
  const palette = theme.palette

  switch (type) {
    case 'success':
      return palette.success.main
    case 'info':
      return palette.info.main
    case 'warning':
      return palette.warning.main
    case 'error':
      return palette.error.main
    default:
      return palette.primary.main
  }
}

interface ToastCardProps {
  toastType: ToastType
  state: ToastState
}

const ToastViewport = styled('div')(({ theme }) => ({
  position: 'fixed',
  top: 80,
  right: 16,
  zIndex: theme.zIndex.snackbar,
  display: 'flex',
  width: 'calc(100vw - 32px)',
  maxWidth: 420,
  flexDirection: 'column',
  gap: 10,
  pointerEvents: 'none',
  '@media (min-width: 900px)': {
    top: 104,
    right: 24,
  },
  '@keyframes toast-slide-in': {
    from: {
      opacity: 0,
      transform: 'translateX(20px) scale(0.97)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) scale(1)',
    },
  },
  '@keyframes toast-spin': {
    to: {
      transform: 'rotate(360deg)',
    },
  },
}))

const ToastCard = styled('section', {
  shouldForwardProp: (prop) => prop !== 'toastType' && prop !== 'state',
})<ToastCardProps>(({ theme, toastType, state }) => ({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '20px minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: 12,
  overflow: 'hidden',
  padding: '14px 12px 14px 14px',
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: Number(theme.shape.borderRadius) * 2,
  boxShadow: theme.shadows[8],
  opacity: state === 'closing' ? 0 : 1,
  transform: state === 'closing' ? 'translateX(20px) scale(0.97)' : 'translateX(0) scale(1)',
  transition: 'opacity 220ms ease, transform 220ms ease',
  animation: state === 'open' ? 'toast-slide-in 280ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
  pointerEvents: 'auto',
  '&::before': {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
    content: '""',
    backgroundColor: toneColor(theme, toastType),
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
  },
}))

const ToastStatusIcon = styled('span', {
  shouldForwardProp: (prop) => prop !== 'toastType',
})<{ toastType: ToastType }>(({ theme, toastType }) => ({
  display: 'inline-flex',
  color: toneColor(theme, toastType),
  '& svg': {
    width: 20,
    height: 20,
  },
  ...(toastType === 'loading' && {
    '& svg': {
      width: 20,
      height: 20,
      animation: 'toast-spin 900ms linear infinite',
    },
  }),
  '@media (prefers-reduced-motion: reduce)': {
    '& svg': {
      animation: 'none',
    },
  },
}))

const ToastContent = styled('div')({
  minWidth: 0,
})

const ToastTitle = styled('div')(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 700,
  lineHeight: 1.35,
}))

const ToastDescription = styled('div')(({ theme }) => ({
  marginTop: 3,
  color: theme.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: 1.45,
}))

const ToastControls = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginTop: -4,
  marginRight: -4,
})

const ToastAction = styled('button')(({ theme }) => ({
  padding: '5px 8px',
  color: theme.palette.primary.main,
  font: 'inherit',
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 700,
  lineHeight: 1.2,
  cursor: 'pointer',
  background: 'transparent',
  border: 0,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['background-color']),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 1,
  },
}))

const ToastCloseButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  padding: 0,
  color: theme.palette.text.secondary,
  cursor: 'pointer',
  background: 'transparent',
  border: 0,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['background-color', 'color']),
  '&:hover': {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.action.hover,
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 1,
  },
  '& svg': {
    width: 18,
    height: 18,
  },
}))

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconByType: Record<ToastType, ReactNode> = {
    default: <Info />,
    success: <CheckCircle2 />,
    info: <Info />,
    warning: <CircleAlert />,
    error: <CircleX />,
    loading: <LoaderCircle />,
  }

  return <ToastStatusIcon toastType={type}>{iconByType[type]}</ToastStatusIcon>
}

const ToastItem = ({ item }: { item: ToastRecord }) => {
  useEffect(() => {
    if (item.state !== 'open' || item.duration <= 0 || item.duration === Infinity) return

    const timeout = window.setTimeout(() => closeToast(item.id), item.duration)
    return () => window.clearTimeout(timeout)
  }, [item.duration, item.id, item.state, item.type])

  const { children: actionLabel, ...actionProps } = item.actionProps ?? {}

  return (
    <ToastCard
      toastType={item.type}
      state={item.state}
      role={item.type === 'error' || item.type === 'warning' ? 'alert' : 'status'}
      aria-live={item.type === 'error' || item.type === 'warning' ? 'assertive' : 'polite'}
    >
      <ToastIcon type={item.type} />
      <ToastContent>
        {item.title && <ToastTitle>{item.title}</ToastTitle>}
        {item.description && <ToastDescription>{item.description}</ToastDescription>}
      </ToastContent>
      <ToastControls>
        {actionLabel && (
          <ToastAction type="button" {...actionProps}>
            {actionLabel}
          </ToastAction>
        )}
        <ToastCloseButton type="button" onClick={() => closeToast(item.id)} aria-label="Dismiss notification">
          <X />
        </ToastCloseButton>
      </ToastControls>
    </ToastCard>
  )
}

export const Toaster = () => {
  const items = useSyncExternalStore(subscribe, getToastRecords, getToastRecords)

  return (
    <ToastViewport aria-label="Notifications">
      {items.map((item) => (
        <ToastItem key={item.id} item={item} />
      ))}
    </ToastViewport>
  )
}
