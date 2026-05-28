// app/not-found.tsx - Server Component Version

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function NotFound() {
  const cookieStore = cookies();
  const token = cookieStore.get('access_token')?.value;
  const isAuthenticated = !!token;

  // Redirect immediately
  if (!isAuthenticated) {
    redirect('/login');
  } else {
    redirect('/dashboard');
  }

  // Fallback UI (will not be shown due to redirect)
  return null;
}