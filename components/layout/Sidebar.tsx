'use client';

import { useAuthStore } from '@/store/authStore';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { useState } from 'react';

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
} from 'react-icons/fi';

import { hasAccess } from '@/config/permissions';

// ======================
// NAVIGATION ITEMS
// ======================

const navItems = [
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
      {
        name: 'Sales Items',
        href: '/sales/items',
      },

      {
        name: 'Sales History',
        href: '/sales/history',
      },

      {
        name: 'Customers',
        href: '/sales/customers',
      },

      {
        name: 'Returns',
        href: '/sales/returns',
      },
    ],
  },

  {
    name: 'Inventory',
    icon: FiBox,
    module: 'inventory',

    subItems: [
      {
        name: 'Products',
        href: '/inventory/products',
      },

      {
        name: 'Categories',
        href: '/inventory/categories',
      },

      {
        name: 'Suppliers',
        href: '/inventory/suppliers',
      },

      {
        name: 'Stock',
        href: '/inventory/stock',
      },
    ],
  },

  {
    name: 'Financials',
    icon: FiDollarSign,
    module: 'financials',

    subItems: [
      {
        name: 'Transactions',
        href: '/financials/transactions',
      },

      {
        name: 'Invoices',
        href: '/financials/invoices',
      },

      {
        name: 'Petty Cash',
        href: '/financials/petty-cash',
      },

      {
        name: 'Loans',
        href: '/financials/loans',
      },
    ],
  },

  {
    name: 'HR',
    icon: FiUsers,
    module: 'hr',

    subItems: [
      {
        name: 'Departments',
        href: '/hr/departments',
      },

      {
        name: 'Employees',
        href: '/hr/employees',
      },

      {
        name: 'Payroll',
        href: '/hr/payroll',
      },

      {
        name: 'Salaries',
        href: '/hr/salaries',
      },
    ],
  },

  {
    name: 'Analytics',
    icon: FiBarChart2,
    module: 'analytics',

    subItems: [
      {
        name: 'Dashboard',
        href: '/bi/dashboard',
      },

      {
        name: 'Financial Analytics',
        href: '/bi/financial',
      },

      {
        name: 'Reports',
        href: '/reports',
      },
    ],
  },

  {
    name: 'User Management',
    href: '/users',
    icon: FiUsers,
    module: 'users',
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

export default function Sidebar({
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { user, logout } =
    useAuthStore();

  const pathname = usePathname();

  const [openMenus, setOpenMenus] =
    useState<Record<string, boolean>>(
      {}
    );

  const role =
    user?.role_name || '';

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = (
    menuName: string
  ) => {
    setOpenMenus((prev) => ({
      ...prev,

      [menuName]:
        !prev[menuName],
    }));
  };

  const isSubItemActive = (
    subItems: {
      name: string;
      href: string;
    }[]
  ) => {
    return subItems.some(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(
          item.href + '/'
        )
    );
  };

  const isActive = (
    href: string
  ) => {
    return (
      pathname === href ||
      pathname.startsWith(
        href + '/'
      )
    );
  };

  // ======================
  // FILTER NAV ITEMS
  // ======================

  const filteredNavItems =
    navItems.filter((item) =>
      hasAccess(
        role,
        item.module
      )
    );

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* LOGO */}

      <div className="border-b border-gray-200 flex flex-col items-center justify-center">

        <div className="relative w-[200px] h-[90px] mb-1">
          <Image
            src="/images/BizSmartLogo.png"
            alt="BizSmart Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-xl font-bold text-brand-900 text-center">
          BizSmart
        </h1>

        <p className="text-xs text-gray-500 mt-1 text-center truncate max-w-full px-2">
          {user?.business_name ||
            'Business'}
        </p>
      </div>

      {/* NAVIGATION */}

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">

        {filteredNavItems.map(
          (item) => {
            const Icon =
              item.icon;

            // ======================
            // DROPDOWN ITEMS
            // ======================

            if (
              item.subItems
            ) {
              const isMenuOpen =
                openMenus[
                  item.name
                ] ||
                isSubItemActive(
                  item.subItems
                );

              return (
                <div
                  key={item.name}
                  className="space-y-1"
                >
                  <button
                    onClick={() =>
                      toggleMenu(
                        item.name
                      )
                    }
                    className={`
                    w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${
                      isSubItemActive(
                        item.subItems
                      )
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={20}
                      />

                      <span className="text-sm font-medium">
                        {
                          item.name
                        }
                      </span>
                    </div>

                    {isMenuOpen ? (
                      <FiChevronDown
                        size={16}
                      />
                    ) : (
                      <FiChevronRight
                        size={16}
                      />
                    )}
                  </button>

                  {isMenuOpen && (
                    <div className="ml-6 pl-2 space-y-1 border-l border-gray-200">

                      {item.subItems.map(
                        (
                          subItem
                        ) => {
                          const isSubActive =
                            isActive(
                              subItem.href
                            );

                          return (
                            <Link
                              key={
                                subItem.href
                              }
                              href={
                                subItem.href
                              }
                              onClick={
                                onMobileClose
                              }
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

                              <span>
                                {
                                  subItem.name
                                }
                              </span>
                            </Link>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // ======================
            // NORMAL LINK
            // ======================

            const isItemActive =
              isActive(
                item.href || ''
              );

            return (
              <Link
                key={item.href}
                href={
                  item.href ||
                  '#'
                }
                onClick={
                  onMobileClose
                }
                className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${
                  isItemActive
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
              >
                <Icon
                  size={20}
                />

                <span className="text-sm font-medium">
                  {item.name}
                </span>
              </Link>
            );
          }
        )}
      </nav>

      {/* USER SECTION */}

      <div className="p-4 border-t border-gray-200">

        <div className="flex items-center justify-between">

          <div className="flex-1 min-w-0">

            <p className="text-sm font-medium text-gray-700 truncate">
              {user?.username ||
                'User'}
            </p>

            <p className="text-xs text-gray-500 capitalize truncate">
              {user?.role_name ||
                'Role'}
            </p>
          </div>

          <button
            onClick={
              handleLogout
            }
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Logout"
          >
            <FiLogOut
              size={18}
            />
          </button>
        </div>
      </div>
    </div>
  );

  // ======================
  // DESKTOP
  // ======================

  if (
    !isMobileOpen &&
    typeof isMobileOpen !==
      'undefined'
  ) {
    return (
      <div className="hidden lg:block w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0">
        {sidebarContent}
      </div>
    );
  }

  // ======================
  // MOBILE
  // ======================

  if (isMobileOpen) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={
            onMobileClose
          }
        />

        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-xl lg:hidden">

          <div className="relative">

            <button
              onClick={
                onMobileClose
              }
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <FiX
                size={20}
              />
            </button>

            {
              sidebarContent
            }
          </div>
        </div>
      </>
    );
  }

  // ======================
  // DEFAULT DESKTOP
  // ======================

  return (
    <div className="hidden lg:block w-64 h-screen bg-white border-r border-gray-200 sticky top-0">
      {sidebarContent}
    </div>
  );
}