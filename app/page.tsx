// app/page.tsx - Modern Landing Page with Fixed Colors

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  FiShoppingCart,
  FiPackage,
  FiDollarSign,
  FiUsers,
  FiBarChart2,
  FiShield,
  FiCreditCard,
  FiClock,
  FiRotateCcw,
  FiTrendingUp,
  FiStar,
  FiZap,
  FiLock,
  FiCloud,
  FiCheckCircle,
  FiArrowRight,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { FaRocket } from 'react-icons/fa';

// Brand Colors
const brandColors = {
  navy: '#003366',
  ocean: '#0077C0',
  teal: '#00A896',
  emerald: '#00B464',
};

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      if (statsRef.current) {
        const rect = statsRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100 && !animateStats) {
          setAnimateStats(true);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [animateStats]);

  const modules = [
    {
      name: 'Point of Sale',
      icon: FiCreditCard,
      description: 'Fast and intuitive POS system for retail stores',
      gradient: `from-[${brandColors.ocean}] to-[${brandColors.teal}]`,
      iconColor: brandColors.ocean,
      href: '/sales/pos',
      features: ['Quick checkout', 'Multiple payment methods', 'Receipt printing'],
    },
    {
      name: 'Sales Management',
      icon: FiShoppingCart,
      description: 'Track sales, manage customers, and process returns',
      gradient: `from-[${brandColors.teal}] to-[${brandColors.emerald}]`,
      iconColor: brandColors.teal,
      href: '/sales/history',
      features: ['Sales history', 'Customer management', 'Return processing'],
    },
    {
      name: 'Inventory Control',
      icon: FiPackage,
      description: 'Real-time inventory tracking and stock management',
      gradient: `from-[${brandColors.navy}] to-[${brandColors.ocean}]`,
      iconColor: brandColors.navy,
      href: '/inventory/products',
      features: ['Stock tracking', 'Low stock alerts', 'Purchase orders'],
    },
    {
      name: 'Financial Management',
      icon: FiDollarSign,
      description: 'Complete financial control with reports and analytics',
      gradient: `from-[${brandColors.emerald}] to-[${brandColors.teal}]`,
      iconColor: brandColors.emerald,
      href: '/financials/transactions',
      features: ['Transaction tracking', 'Invoice management', 'Financial reports'],
    },
    {
      name: 'HR Management',
      icon: FiUsers,
      description: 'Manage employees, salaries, and payroll efficiently',
      gradient: `from-[${brandColors.ocean}] to-[${brandColors.navy}]`,
      iconColor: brandColors.ocean,
      href: '/hr/employees',
      features: ['Employee records', 'Salary management', 'Payroll processing'],
    },
    {
      name: 'Business Intelligence',
      icon: FiBarChart2,
      description: 'Data-driven insights for better decision making',
      gradient: `from-[${brandColors.teal}] to-[${brandColors.emerald}]`,
      iconColor: brandColors.teal,
      href: '/analytics',
      features: ['Real-time dashboards', 'Sales analytics', 'Performance metrics'],
    },
  ];

  const features = [
    {
      icon: FiTrendingUp,
      title: 'Real-time Analytics',
      description: 'Get instant insights into your business performance',
      color: brandColors.ocean,
    },
    {
      icon: FiZap,
      title: 'Lightning Fast',
      description: 'Optimized for speed and efficiency',
      color: brandColors.teal,
    },
    {
      icon: FiLock,
      title: 'Enterprise Security',
      description: 'Your data is protected with bank-level security',
      color: brandColors.navy,
    },
    {
      icon: FiCloud,
      title: 'Cloud-Based',
      description: 'Access your business from anywhere, anytime',
      color: brandColors.emerald,
    },
  ];

  const stats = [
    { value: '98%', label: 'Customer Satisfaction', icon: FiStar },
    { value: '50K+', label: 'Active Users', icon: FiUsers },
    { value: '1M+', label: 'Transactions', icon: FiShoppingCart },
    { value: '99.9%', label: 'Uptime', icon: FiCloud },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-[#003366]/5 to-[#0077C0]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-[#00A896]/5 to-[#00B464]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Removed background color */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Image 
                  src="/images/BizSmartLogo2.png" 
                  alt="BizSmart Logo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#003366] to-[#0077C0] bg-clip-text text-transparent">
                  BizSmart
                </h1>
                <p className="text-xs text-gray-500">Business Intelligence</p>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#modules" className="text-gray-600 hover:text-[#0077C0] transition font-medium">
                Modules
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-[#0077C0] transition font-medium">
                Features
              </Link>
              <Link href="/login" className="px-6 py-2 text-[#0077C0] border-2 border-[#0077C0] rounded-lg hover:bg-[#0077C0] hover:text-white transition-all duration-300 font-medium">
                Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-3">
                <Link href="#modules" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                  Modules
                </Link>
                <Link href="#features" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                  Features
                </Link>
                <Link href="/login" className="px-4 py-2 text-[#0077C0] border border-[#0077C0] rounded-lg text-center hover:bg-[#0077C0] hover:text-white transition">
                  Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-fadeInUp">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#003366]/10 to-[#0077C0]/10 px-4 py-2 rounded-full mb-6">
                <div className="w-2 h-2 bg-[#00A896] rounded-full animate-pulse"></div>
                <span className="text-sm text-[#0077C0] font-medium">All-in-One Platform</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                <span className="text-gray-900">Manage Your</span>
                <br />
                <span className="bg-gradient-to-r from-[#003366] via-[#0077C0] to-[#00A896] bg-clip-text text-transparent">
                  Business Smarter
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                One platform to manage sales, inventory, finances, HR, and more. 
                Everything you need to run your business efficiently.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="group px-8 py-3 bg-gradient-to-r from-[#003366] to-[#0077C0] text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  Start Free Trial
                  <FiArrowRight className="group-hover:translate-x-1 transition" />
                </Link>
                <Link
                  href="#modules"
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-[#0077C0] hover:text-[#0077C0] transition-all duration-300"
                >
                  Explore Modules
                </Link>
              </div>
            </div>

            {/* Right Illustration - Fixed Icons */}
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-to-br from-[#003366]/20 to-[#00A896]/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/40 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
                <div className="grid grid-cols-3 gap-4">
                  {modules.slice(0, 6).map((module, idx) => {
                    const Icon = module.icon;
                    return (
                      <div 
                        key={idx} 
                        className="group bg-white rounded-xl p-4 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                          <Icon className="w-7 h-7" style={{ color: module.iconColor }} />
                        </div>
                        <p className="text-gray-700 text-sm font-medium">{module.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-gradient-to-r from-[#003366]/5 via-[#0077C0]/5 to-[#00A896]/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center group">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition">
                      <Icon className="w-6 h-6 text-[#0077C0]" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-[#003366] mb-1">
                    {animateStats ? (
                      <span className="animate-countUp">{stat.value}</span>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modules Section - Fixed Icons */}
      <section id="modules" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fadeInUp">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#003366] to-[#0077C0] bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive modules designed to streamline every aspect of your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, idx) => {
              const Icon = module.icon;
              return (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                    <Icon className="w-8 h-8" style={{ color: module.iconColor }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{module.name}</h3>
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  <div className="space-y-2 mb-5">
                    {module.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-sm text-gray-500">
                        <FiCheckCircle className="w-4 h-4 text-[#00B464]" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={module.href}
                    className="inline-flex items-center gap-1 text-[#0077C0] font-medium hover:gap-2 transition-all duration-300"
                  >
                    Learn More
                    <FiArrowRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Fixed Icons */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#003366] to-[#00A896] bg-clip-text text-transparent">
                Why Choose BizSmart?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern technology to help your business grow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="text-center group animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#003366] to-[#0077C0] rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition"></div>
                    <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                      <Icon className="w-10 h-10" style={{ color: feature.color }} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-[#003366] via-[#0077C0] to-[#00A896]"></div>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <FaRocket className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Get Started Today</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of businesses using BizSmart to grow and succeed.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="group px-8 py-3 bg-white text-[#003366] rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  Start Free Trial
                  <FiArrowRight className="group-hover:translate-x-1 transition" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Fixed Logo */}
      <footer className="bg-[#003366] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image 
                    src="/images/BizSmartLogo2.png" 
                    alt="BizSmart Logo" 
                    width={32} 
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-xl">BizSmart</span>
              </div>
              <p className="text-blue-200 text-sm">
                All-in-One Business Intelligence Platform
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-[#00A896]">Product</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><Link href="#modules" className="hover:text-white transition">Modules</Link></li>
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-[#00A896]">Company</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-[#00A896]">Legal</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-blue-800 text-center text-blue-300 text-sm">
            &copy; 2024 BizSmart. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes countUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-countUp {
          animation: countUp 0.8s ease-out forwards;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}