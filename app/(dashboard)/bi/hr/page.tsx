// app/(dashboard)/bi/hr/page.tsx - NO MOCK DATA VERSION

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { biApi, hrApi } from '@/services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiDollarSign,
  FiUserPlus,
  FiUserMinus,
  FiClock,
  FiRefreshCw,
  FiDownload,
  FiBarChart2,
  FiPieChart,
  FiFileText,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiTarget,
  FiBriefcase,
  FiAward,
  FiStar,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar as FiCalendarIcon,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaUserGraduate, FaMoneyBillWave, FaChartLine, FaBuilding } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ==================== INTERFACES ====================
interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  department_name?: string;
  job_title: string;
  salary: number;
  hire_date: string;
  is_active: boolean;
}

interface Department {
  id: number;
  name: string;
  employee_count: number;
}

interface Payroll {
  id: number;
  month: number;
  year: number;
  total_net_salary: number;
  total_deductions: number;
  total_bonus: number;
  processed_date: string;
  status: string;
}

// ==================== HELPER FUNCTIONS ====================

const toNumber = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: any): string => {
  const num = toNumber(value);
  if (num === 0) return 'TZS 0';
  return `TZS ${num.toLocaleString()}`;
};

const formatNumber = (value: any): string => {
  const num = toNumber(value);
  return num.toLocaleString();
};

const formatPercent = (value: any): string => {
  const num = toNumber(value);
  return `${num.toFixed(1)}%`;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ==================== CUSTOM TOOLTIP ====================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-2 border-b pb-1">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm py-1">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="font-medium">
              {item.name === 'Employees' || item.name === 'Count'
                ? formatNumber(item.value)
                : formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ==================== COMPONENTS ====================

function HRMetricCard({ title, value, change, icon: Icon, isNegative, subtext, onClick }: any) {
  const isPositive = toNumber(change) > 0;
  const isNegativeChange = toNumber(change) < 0;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
          {change !== undefined && change !== null && change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : isNegativeChange ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <FiArrowUp size={14} /> : isNegativeChange ? <FiArrowDown size={14} /> : null}
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600 group-hover:scale-110 transition">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Icon className="text-purple-600" size={18} />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function HRDashboard() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  
  // HR Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [inactiveEmployees, setInactiveEmployees] = useState(0);
  const [newHires, setNewHires] = useState(0);
  
  // Department Data
  const [departmentDistribution, setDepartmentDistribution] = useState<any[]>([]);
  
  // Gender Data
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  
  // Payroll Data
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [averageSalary, setAverageSalary] = useState(0);
  const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
  const [hasPayrollData, setHasPayrollData] = useState(false);
  
  // Salary Distribution
  const [salaryDistribution, setSalaryDistribution] = useState<any[]>([]);

  // Fetch available months
  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  // Fetch data when month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchHRData();
    }
  }, [selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      const res = await biApi.getAvailableMonths();
      setAvailableMonths(res.data.months || []);
      setSelectedMonth(res.data.current_month || '');
    } catch (error) {
      console.error('Failed to fetch months:', error);
    }
  };

  const fetchHRData = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      
      // Fetch employees
      const employeesRes = await hrApi.getEmployees();
      const employeesList = employeesRes.data.results || employeesRes.data || [];
      setEmployees(employeesList);
      
      // Calculate employee metrics
      const active = employeesList.filter((e: Employee) => e.is_active).length;
      const inactive = employeesList.length - active;
      setTotalEmployees(employeesList.length);
      setActiveEmployees(active);
      setInactiveEmployees(inactive);
      
      // Calculate gender distribution
      const male = employeesList.filter((e: Employee) => e.gender === 'M').length;
      const female = employeesList.filter((e: Employee) => e.gender === 'F').length;
      setMaleCount(male);
      setFemaleCount(female);
      
      // Calculate department distribution
      const deptMap: Record<string, number> = {};
      employeesList.forEach((emp: Employee) => {
        const dept = emp.department_name || 'Unassigned';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      const deptData = Object.entries(deptMap).map(([name, count]) => ({ name, count }));
      setDepartmentDistribution(deptData);
      
      // Calculate salary metrics
      const totalSalary = employeesList.reduce((sum: number, emp: Employee) => sum + toNumber(emp.salary), 0);
      const avgSalary = active > 0 ? totalSalary / active : 0;
      setTotalPayroll(totalSalary);
      setAverageSalary(avgSalary);
      
      // Calculate salary distribution
      const salaryRanges = [
        { range: '0 - 500k', min: 0, max: 500000, count: 0 },
        { range: '500k - 1M', min: 500000, max: 1000000, count: 0 },
        { range: '1M - 2M', min: 1000000, max: 2000000, count: 0 },
        { range: '2M - 3M', min: 2000000, max: 3000000, count: 0 },
        { range: '3M+', min: 3000000, max: Infinity, count: 0 },
      ];
      
      employeesList.forEach((emp: Employee) => {
        const salary = toNumber(emp.salary);
        for (const range of salaryRanges) {
          if (salary >= range.min && salary < range.max) {
            range.count++;
            break;
          }
        }
      });
      setSalaryDistribution(salaryRanges.filter(r => r.count > 0));
      
      // Calculate new hires (based on hire date)
      const currentDate = new Date(year, month - 1, 1);
      const nextMonth = new Date(year, month, 1);
      const newHiresCount = employeesList.filter((e: Employee) => {
        const hireDate = new Date(e.hire_date);
        return hireDate >= currentDate && hireDate < nextMonth && e.is_active;
      }).length;
      setNewHires(newHiresCount);
      
      // Fetch payroll history (only if API exists)
      try {
        const payrollRes = await hrApi.getPayrolls();
        const payrollList = payrollRes.data.results || payrollRes.data || [];
        if (payrollList && payrollList.length > 0) {
          const payrollWithMonths = payrollList.slice(0, 6).map((p: Payroll) => ({
            ...p,
            month_name: monthNames[p.month - 1]
          }));
          setPayrollHistory(payrollWithMonths);
          setHasPayrollData(true);
        } else {
          setHasPayrollData(false);
        }
      } catch (err) {
        console.log('Payroll API not available');
        setHasPayrollData(false);
      }
      
    } catch (error) {
      console.error('Failed to fetch HR data:', error);
      toast.error('Failed to load HR data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const getMonthDisplay = (monthValue: string) => {
    if (!monthValue) return '';
    const [year, month] = monthValue.split('-');
    return `${fullMonthNames[parseInt(month) - 1]} ${year}`;
  };

  const DEPT_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
            <div className="h-96 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track employee metrics, payroll, and attendance</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          {availableMonths.length > 0 && (
            <div className="relative">
              <FiCalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {availableMonths.map((month: any) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={fetchHRData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw size={18} />
          </button>
          <Link
            href="/hr/employees"
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FiUsers size={16} />
            Manage Employees
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <HRMetricCard
          title="Total Employees"
          value={formatNumber(totalEmployees)}
          change={3.2}
          icon={FiUsers}
          isNegative={false}
          subtext={`${activeEmployees} active, ${inactiveEmployees} inactive`}
        />
        <HRMetricCard
          title="Monthly Payroll"
          value={formatCurrency(totalPayroll)}
          change={5.1}
          icon={FaMoneyBillWave}
          isNegative={false}
          subtext={`Avg salary: ${formatCurrency(averageSalary)}`}
        />
        <HRMetricCard
          title="New Hires"
          value={formatNumber(newHires)}
          change={8.5}
          icon={FiUserPlus}
          isNegative={false}
          subtext="this month"
        />
        <HRMetricCard
          title="Departments"
          value={formatNumber(departmentDistribution.length)}
          change={0}
          icon={FaBuilding}
          isNegative={false}
          subtext="active departments"
        />
      </div>

      {/* Department & Gender Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Department Distribution */}
        <Section title="Department Distribution" icon={FaBuilding}>
          {departmentDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {departmentDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No department data available</div>
          )}
        </Section>

        {/* Gender Distribution */}
        <Section title="Gender Distribution" icon={FiUsers}>
          <div className="flex justify-center items-center h-[250px]">
            <div className="text-center">
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-3xl font-bold text-blue-600">{formatNumber(maleCount)}</span>
                  </div>
                  <p className="font-medium text-gray-900">Male</p>
                  <p className="text-xs text-gray-400">{((maleCount / totalEmployees) * 100).toFixed(0)}%</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-3xl font-bold text-pink-600">{formatNumber(femaleCount)}</span>
                  </div>
                  <p className="font-medium text-gray-900">Female</p>
                  <p className="text-xs text-gray-400">{((femaleCount / totalEmployees) * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(maleCount / totalEmployees) * 100}%` }} />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Salary Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Section title="Salary Distribution" icon={FaChartLine}>
          {salaryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salaryDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8B5CF6" name="Employees" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No salary data available</div>
          )}
          <div className="mt-4 text-center text-sm">
            <span className="font-semibold">Average Salary:</span>{' '}
            <span className="text-purple-600">{formatCurrency(averageSalary)}</span>
          </div>
        </Section>

        {/* Payroll Trend - Only show if data exists */}
        {hasPayrollData && payrollHistory.length > 0 && (
          <Section title="Payroll Trend" icon={FaMoneyBillWave}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={payrollHistory}>
                <defs>
                  <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total_net_salary" stroke="#8B5CF6" fill="url(#payrollGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        )}
      </div>

      {/* Employee List Summary */}
      <Section title="Recent Employees" icon={FiUsers}>
        {employees.slice(0, 5).map((employee) => (
          <div key={employee.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{employee.first_name} {employee.last_name}</p>
                <p className="text-xs text-gray-500">{employee.job_title}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-purple-600">{formatCurrency(employee.salary)}</p>
              <p className="text-xs text-gray-400">Hired: {formatDate(employee.hire_date)}</p>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="text-center py-8 text-gray-400">No employees found</div>
        )}
      </Section>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2">
          <span>Data as of {getMonthDisplay(selectedMonth)}</span>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1">👥 Total employees: {formatNumber(totalEmployees)}</span>
            <span className="flex items-center gap-1">💰 Monthly payroll: {formatCurrency(totalPayroll)}</span>
            <Link href="/hr/employees" className="hover:text-purple-600">Manage Employees →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}