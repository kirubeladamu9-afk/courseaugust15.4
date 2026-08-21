import { Course } from '@/interfaces/course'

const getErrorMessage = async (response: Response) => {
  const body = await response.json().catch(() => null)
  return body?.message ?? 'Unable to complete your request.'
}

export const getCourses = async (): Promise<Array<Course>> => {
  const response = await fetch('/api/courses')
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

export const submitCredentials = async (mode: 'sign-in' | 'sign-up', email: string, password: string) => {
  const response = await fetch(`/api/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}
