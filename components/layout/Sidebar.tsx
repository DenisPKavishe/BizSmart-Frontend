// // components/layout/Sidebar.tsx
// 'use client';

// import { useAuthStore } from '@/store/authStore';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import {
//   FiHome,
//   FiShoppingCart,
//   FiBox,
//   FiDollarSign,
//   FiUsers,
//   FiBarChart2,
//   FiLogOut,
//   FiFileText,
//   FiTruck,
//   FiUserCheck,
//   FiTrendingUp,
//   FiMenu,
//   FiX,
//   FiPackage,
// } from 'react-icons/fi';
// import { useState } from 'react';

// // Define navigation items with required roles
// const navItems = [
//   { 
//     name: 'Dashboard', 
//     href: '/dashboard', 
//     icon: FiHome, 
//     roles: ['owner', 'general_manager', 'accountant', 'auditor'] 
//   },
//   { 
//     name: 'POS', 
//     href: '/sales/pos', 
//     icon: FiShoppingCart, 
//     roles: ['owner', 'general_manager', 'cashier'] 
//   },
//   { 
//     name: 'Sales', 
//     href: '/sales/history', 
//     icon: FiFileText, 
//     roles: ['owner', 'general_manager', 'accountant', 'cashier', 'auditor'] 
//   },
//   { 
//     name: 'Customers', 
//     href: '/sales/customers', 
//     icon: FiUsers, 
//     roles: ['owner', 'general_manager', 'cashier', 'auditor'] 
//   },
//   { 
//     name: 'Products', 
//     href: '/inventory/products', 
//     icon: FiBox, 
//     roles: ['owner', 'general_manager', 'inventory_manager', 'cashier', 'auditor'] 
//   },
//   { 
//     name: 'Suppliers', 
//     href: '/inventory/suppliers', 
//     icon: FiTruck, 
//     roles: ['owner', 'general_manager', 'inventory_manager', 'auditor'] 
//   },
//   { 
//     name: 'Stock', 
//     href: '/inventory/stock', 
//     icon: FiPackage, 
//     roles: ['owner', 'general_manager', 'inventory_manager'] 
//   },
//   { 
//     name: 'Financials', 
//     href: '/financials/transactions', 
//     icon: FiDollarSign, 
//     roles: ['owner', 'general_manager', 'accountant', 'auditor'] 
//   },
//   { 
//     name: 'Invoices', 
//     href: '/financials/invoices', 
//     icon: FiFileText, 
//     roles: ['owner', 'general_manager', 'accountant', 'auditor'] 
//   },
//   { 
//     name: 'Employees', 
//     href: '/hr/employees', 
//     icon: FiUsers, 
//     roles: ['owner', 'general_manager', 'accountant', 'auditor'] 
//   },
//   { 
//     name: 'Payroll', 
//     href: '/hr/payroll', 
//     icon: FiUserCheck, 
//     roles: ['owner', 'accountant'] 
//   },
//   { 
//     name: 'Analytics', 
//     href: '/bi/dashboard', 
//     icon: FiBarChart2, 
//     roles: ['owner', 'general_manager', 'accountant', 'auditor'] 
//   },
//   { 
//     name: 'Reports', 
//     href: '/reports', 
//     icon: FiTrendingUp, 
//     roles: ['owner', 'general_manager', 'accountant', 'auditor'] 
//   },
// ];

// interface SidebarProps {
//   isMobileOpen?: boolean;
//   onMobileClose?: () => void;
// }

// export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
//   const { user, logout } = useAuthStore();
//   const pathname = usePathname();
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   // Filter navigation items based on user role
//   const visibleNavItems = navItems.filter(item => {
//     if (!user?.role) return false;
//     // Owner can see everything
//     if (user.role === 'owner') return true;
//     // Check if user's role is in the allowed roles for this item
//     return item.roles.includes(user.role);
//   });

//   const handleLogout = () => {
//     logout();
//   };

//   const toggleSidebar = () => {
//     setIsCollapsed(!isCollapsed);
//   };

//   return (
//     <>
//       {/* Mobile overlay */}
//       {isMobileOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
//           onClick={onMobileClose}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={`
//           fixed lg:sticky top-0 left-0 z-30 h-screen bg-white border-r border-gray-200 transition-all duration-300
//           ${isCollapsed ? 'w-20' : 'w-64'}
//           ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//         `}
//       >
//         {/* Logo Section */}
//         <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-200`}>
//           {!isCollapsed && (
//             <div>
//               <h1 className="text-xl font-bold text-brand-900">BizSmart</h1>
//               <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.business_name}</p>
//             </div>
//           )}
//           {isCollapsed && (
//             <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
//               <span className="text-white font-bold text-sm">B</span>
//             </div>
//           )}
//           <button
//             onClick={toggleSidebar}
//             className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition hidden lg:block"
//           >
//             {isCollapsed ? <FiMenu size={18} /> : <FiX size={18} />}
//           </button>
//           {isMobileOpen && !isCollapsed && (
//             <button
//               onClick={onMobileClose}
//               className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition lg:hidden"
//             >
//               <FiX size={18} />
//             </button>
//           )}
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 py-4 overflow-y-auto h-[calc(100vh-140px)]">
//           {visibleNavItems.map((item) => {
//             const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
//             const Icon = item.icon;
            
//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 onClick={onMobileClose}
//                 className={`
//                   flex items-center gap-3 mx-2 my-1 px-3 py-2.5 rounded-lg transition-all duration-200
//                   ${isActive 
//                     ? 'bg-brand-500 text-white shadow-md' 
//                     : 'text-gray-600 hover:bg-gray-100'
//                   }
//                   ${isCollapsed ? 'justify-center' : ''}
//                 `}
//                 title={isCollapsed ? item.name : undefined}
//               >
//                 <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
//                 {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* User Section */}
//         <div className={`p-4 border-t border-gray-200 ${isCollapsed ? 'text-center' : ''}`}>
//           <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
//             {!isCollapsed && (
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium text-gray-700 truncate">{user?.username || 'User'}</p>
//                 <p className="text-xs text-gray-500 capitalize truncate">{user?.role_name || 'Role'}</p>
//               </div>
//             )}
//             <button
//               onClick={handleLogout}
//               className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
//               title="Logout"
//             >
//               <FiLogOut size={18} />
//             </button>
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// }

// components/layout/Sidebar.tsx
// components/layout/Sidebar.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiShoppingCart,
  FiBox,
  FiDollarSign,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiFileText,
  FiTruck,
  FiUserCheck,
  FiTrendingUp,
  FiX,
  FiPackage,
  FiGrid,
} from 'react-icons/fi';

// All navigation items
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'POS', href: '/sales/pos', icon: FiShoppingCart },
  { name: 'Sales', href: '/sales/history', icon: FiFileText },
  { name: 'Customers', href: '/sales/customers', icon: FiUsers },
  { name: 'Products', href: '/inventory/products', icon: FiBox },
  { name: 'Categories', href: '/inventory/categories', icon: FiGrid }, 
  { name: 'Suppliers', href: '/inventory/suppliers', icon: FiTruck },
  { name: 'Stock', href: '/inventory/stock', icon: FiPackage },
  { name: 'Financials', href: '/financials/transactions', icon: FiDollarSign },
  { name: 'Invoices', href: '/financials/invoices', icon: FiFileText },
  { name: 'Petty Cash', href: '/financials/petty-cash', icon: FiDollarSign }, 
  { name: 'Loans', href: '/financials/loans', icon: FiDollarSign },
  { name: 'Employees', href: '/hr/employees', icon: FiUsers },
  { name: 'Payroll', href: '/hr/payroll', icon: FiUserCheck },
  { name: 'Salaries', href: '/hr/salaries', icon: FiUserCheck },
  { name: 'Analytics', href: '/bi/dashboard', icon: FiBarChart2 },
  { name: 'Analytics', href: '/bi/financial', icon: FiBarChart2 },
  { name: 'Reports', href: '/reports', icon: FiTrendingUp },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
  };

  // Sidebar content - same for both mobile and desktop
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-bold text-brand-900">BizSmart</h1>
        <p className="text-xs text-gray-500 mt-1 truncate">{user?.business_name || 'Business'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-brand-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{user?.role_name || 'Role'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Logout"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Desktop sidebar - always visible
  if (!isMobileOpen && typeof isMobileOpen !== 'undefined') {
    return (
      <div className="hidden lg:block w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0">
        {sidebarContent}
      </div>
    );
  }

  // Mobile sidebar - overlay
  if (isMobileOpen) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
        {/* Sidebar panel */}
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-xl lg:hidden">
          <div className="relative">
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <FiX size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      </>
    );
  }

  // Default desktop view (when isMobileOpen is undefined)
  return (
    <div className="hidden lg:block w-64 h-screen bg-white border-r border-gray-200 sticky top-0">
      {sidebarContent}
    </div>
  );
}