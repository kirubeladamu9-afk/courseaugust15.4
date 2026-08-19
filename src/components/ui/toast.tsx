'use client'

import { useEffect, useState } from 'react'
import type { FC } from 'react'

export type ToastType = 'default' | 'success' | 'info' | 'warning' | 'error'

export interface ToastOptions {
  type?: ToastType
  description: string
  priority?: 'high'
}

interface ToastItem extends ToastOptions {
  id: number
}

type ToastListener = (items: ToastItem[]) => void

let nextToastId = 0
let items: ToastItem[] = []
const listeners = new Set<ToastListener>()

const notify = () => listeners.forEach((listener) => listener(items))

export const toast = {
  add(options: ToastOptions) {
    const item = { ...options, id: nextToastId++ }
    items = [...items, item]
    notify()
    window.setTimeout(() => {
      items = items.filter(({ id }) => id !== item.id)
      notify()
    }, item.priority === 'high' ? 6000 : 4000)
  },
}

export const ToastViewport: FC = () => {
  const [visibleItems, setVisibleItems] = useState<ToastItem[]>(items)

  useEffect(() => {
    const listener: ToastListener = (nextItems) => setVisibleItems([...nextItems])
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return (
    <div className="toast-viewport" aria-live="polite">
      {visibleItems.map((item) => (
        <div className="toast-notification" role="status" key={item.id}>
          {item.description}
        </div>
      ))}
    </div>
  )
}
