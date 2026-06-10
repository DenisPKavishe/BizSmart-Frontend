
'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FiHome,
  FiShoppingCart,
  FiBox,
  FiDollarSign,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiFileText,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiMenu,
  FiActivity,
} from 'react-icons/fi';
import { hasAccess, normalizeRole } from '@/config/permissions';


interface SubNavItem {
  name: string;
  href: string;
  module: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  module: string;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: FiHome,
    module: 'dashboard',
  },
  {
    name: 'POS',
    href: '/sales/pos',
    icon: FiShoppingCart,
    module: 'sales',
  },
  {
    name: 'Sales',
    icon: FiFileText,
    module: 'sales',
    subItems: [
      { name: 'Sales History', href: '/sales/history', module: 'sales' },
      { name: 'Sales Items', href: '/sales/items', module: 'sales' },
      { name: 'Customers', href: '/sales/customers', module: 'sales' },
      { name: 'Returns', href: '/sales/returns', module: 'sales' },
    ],
  },
  {
    name: 'Inventory',
    icon: FiBox,
    module: 'inventory',
    subItems: [
      { name: 'Categories', href: '/inventory/categories', module: 'inventory' },
      { name: 'Suppliers', href: '/inventory/suppliers', module: 'inventory' },
      { name: 'Products', href: '/inventory/products', module: 'inventory' },
      { name: 'Stock Movements', href: '/inventory/stock-movements', module: 'inventory' },
      { name: 'Purchase Orders', href: '/inventory/purchase-orders', module: 'inventory' },
    ],
  },
  {
    name: 'Financials',
    icon: FiDollarSign,
    module: 'financials',
    subItems: [
      { name: 'Transactions', href: '/financials/transactions', module: 'financials' },
      { name: 'Invoices', href: '/financials/invoices', module: 'financials' },
      { name: 'Petty Cash', href: '/financials/petty-cash', module: 'financials' },
      { name: 'Loans', href: '/financials/loans', module: 'financials' },
      { name: 'Budget', href: '/financials/budgets', module: 'financials' },
    ],
  },
  {
    name: 'HR',
    icon: FiUsers,
    module: 'hr',
    subItems: [
      { name: 'Departments', href: '/hr/departments', module: 'hr' },
      { name: 'Employees', href: '/hr/employees', module: 'hr' },
      { name: 'Payroll', href: '/hr/payroll', module: 'hr' },
      { name: 'Salaries', href: '/hr/salaries', module: 'hr' },
    ],
  },
  {
    name: 'Analytics',
    icon: FiBarChart2,
    module: 'analytics',
    subItems: [
      { name: 'Dashboard', href: '/bi/dashboard', module: 'analytics' },
      { name: 'Financial Analytics', href: '/bi/financial', module: 'analytics' },
      { name: 'Sales Analytics', href: '/bi/sales', module: 'analytics' },
      { name: 'Inventory Analytics', href: '/bi/inventory', module: 'analytics' },
      { name: 'HR Analytics', href: '/bi/hr', module: 'analytics' },
      { name: 'Customer Analytics', href: '/bi/customers', module: 'analytics' },
      { name: 'Reports', href: '/reports', module: 'analytics' },
    ],
  },
  {
    name: 'User Management',
    href: '/users',
    icon: FiUsers,
    module: 'users',
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    icon: FiActivity,
    module: 'audit',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: FiUser,
    module: 'profile',
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const role = user?.role_name || user?.role || '';
  const normalizedRole = normalizeRole(role);

  // Close mobile menu when clicking outside or on link
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    if (onMobileClose) onMobileClose();
  };

  const isSubItemActive = (subItems: SubNavItem[]) => {
    return subItems.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };


  // FILTER NAV ITEMS BASED ON ROLE PERMISSIONS
 
  
  const filteredNavItems: NavItem[] = navItems
    .filter((item) => {
      // Always include Profile
      if (item.module === 'profile') return true;
      // Check if role has access to this module
      return hasAccess(role, item.module);
    })
    .map((item) => {
      // If item has subItems, filter them too
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter((subItem) => {
          return hasAccess(role, subItem.module);
        });
        
        // Only return the parent item if it has any subItems after filtering
        if (filteredSubItems.length === 0) {
          return null;
        }
        
        return {
          ...item,
          subItems: filteredSubItems,
        };
      }
      return item;
    })
    .filter((item): item is NavItem => item !== null); // Type guard to filter out null

  // Debug logging to see what's being filtered
  console.log('User role:', role);
  console.log('Normalized role:', normalizedRole);
  console.log('Filtered nav items:', filteredNavItems.map(i => ({ name: i.name, module: i.module })));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 flex flex-col items-center justify-center py-4">
        <div className="relative w-[100px] h-[40px] mb-1">
          <Image
            src="/images/BizSmartLogo2.png"
            alt="BizSmart Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-xl font-bold text-brand-900 text-center">BizSmart</h1>
        <p className="text-xs text-gray-500 mt-1 text-center truncate max-w-full px-2">
          {user?.business_name || 'Business'}
        </p>
      </div>

      
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;

         
          if (item.subItems && item.subItems.length > 0) {
            const isMenuOpen = openMenus[item.name] || isSubItemActive(item.subItems);

            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`
                    w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${
                      isSubItemActive(item.subItems)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {isMenuOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>

                {isMenuOpen && (
                  <div className="ml-6 pl-2 space-y-1 border-l border-gray-200">
                    {item.subItems.map((subItem) => {
                      const isSubActive = isActive(subItem.href);
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={closeMobileMenu}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                            ${
                              isSubActive
                                ? 'bg-brand-500 text-white'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }
                          `}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                          <span>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isItemActive = isActive(item.href || '');

          return (
            <Link
              key={item.href || item.name}
              href={item.href || '#'}
              onClick={closeMobileMenu}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isItemActive ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* USER SECTION */}
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

  
  // MOBILE MENU TOGGLE BUTTON
 

  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileMenuOpen(true)}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition"
    >
      <FiMenu size={24} className="text-gray-700" />
    </button>
  );


  // DESKTOP SIDEBAR
 

  const DesktopSidebar = () => (
    <div className="hidden lg:block w-64 h-screen bg-white border-r border-gray-200 sticky top-0">
      {sidebarContent}
    </div>
  );

  
  // MOBILE SIDEBAR (OVERLAY)
 

  const MobileSidebar = () => {
    if (!isMobileMenuOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fadeIn"
          onClick={closeMobileMenu}
        />

        {/* Sidebar */}
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-2xl lg:hidden animate-slideInLeft">
          <div className="relative h-full">
            <button
              onClick={closeMobileMenu}
              className="absolute top-4 right-4 z-50 p-1 text-gray-400 hover:text-gray-600"
            >
              <FiX size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      </>
    );
  };


  // RENDER
 

  return (
    <>
      <MobileMenuButton />
      <DesktopSidebar />
      <MobileSidebar />

      {/* Add margin to main content on mobile to account for menu button */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </>
  );
}