// components/layout/MainLayout.tsx

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { getDefaultRoute, canAccessPage } from '@/config/permissions';
import toast from 'react-hot-toast';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    initAuth();
  }, [checkAuth]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isChecking && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isChecking, isLoading, isAuthenticated, router]);

  // Check page access permissions
  useEffect(() => {
    if (isAuthenticated && user && pathname && pathname !== '/') {
      const role = user?.role_name || user?.role || '';
      const hasAccess = canAccessPage(role, pathname);
      if (!hasAccess) {
        toast.error('You do not have permission to access this page');
        const defaultRoute = getDefaultRoute(role);
        router.push(defaultRoute);
      }
    }
  }, [isAuthenticated, user, pathname, router]);

  if (isChecking || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden lg:ml-0">
        <div className="p-4 md:p-6 mt-14 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}