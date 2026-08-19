export function cn(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}
