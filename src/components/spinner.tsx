import type { ComponentProps } from 'react'
import { LoaderIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export function SpinnerCustom() {
  return (
    <div className="site-load-spinner-group flex items-center gap-4">
      <Spinner className="page-loading-spinner" />
    </div>
  )
}
