// // components/auth/ProtectedRoute.tsx
// 'use client';

// import { useEffect } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { useAuthStore } from '@/store/authStore';

// // Define which roles can access which routes
// const routePermissions: Record<string, string[]> = {
//   '/dashboard': ['owner', 'general_manager', 'accountant', 'auditor'],
//   '/sales/pos': ['owner', 'general_manager', 'cashier'],
//   '/sales/history': ['owner', 'general_manager', 'accountant', 'cashier', 'auditor'],
//   '/inventory/products': ['owner', 'general_manager', 'inventory_manager', 'cashier', 'auditor'],
//   '/inventory/stock': ['owner', 'general_manager', 'inventory_manager'],
//   '/financials/transactions': ['owner', 'general_manager', 'accountant', 'auditor'],
//   '/financials/invoices': ['owner', 'general_manager', 'accountant', 'auditor'],
//   '/hr/employees': ['owner', 'general_manager', 'accountant', 'auditor'],
//   '/hr/payroll': ['owner', 'accountant'],
//   '/bi/dashboard': ['owner', 'general_manager', 'accountant', 'auditor'],
// };

// export function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

//   useEffect(() => {
//     const isValid = checkAuth();
//     if (!isValid && !isLoading) {
//       router.push('/login');
//       return;
//     }

//     // Check role-based access
//     if (isValid && user && pathname) {
//       const allowedRoles = routePermissions[pathname];
//       if (allowedRoles && !allowedRoles.includes(user.role)) {
//         // Redirect to unauthorized page or dashboard
//         router.push('/unauthorized');
//       }
//     }
//   }, [isAuthenticated, isLoading, router, checkAuth, user, pathname]);

//   if (isLoading || !isAuthenticated) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background">
//         <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }

// components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    if (!isLoading && !token && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, token, isAuthenticated, router]);

  // Show loading spinner while checking authentication
  if (isLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}