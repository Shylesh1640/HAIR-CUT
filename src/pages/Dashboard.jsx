import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import {
    DollarSign,
    Users,
    Receipt,
    UserCircle,
    TrendingUp,
    Calendar,
    Package,
    Scissors,
    UserPlus,
    X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { userProfile, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [customerFormData, setCustomerFormData] = useState({
        name: '',
        phone_number: '',
        email: '',
        customer_type: 'new'
    });
    const [stats, setStats] = useState({
        todayRevenue: 0,
        totalCustomers: 0,
        pendingInvoices: 0,
        employeeCount: 0,
        totalServices: 0,
        totalProducts: 0,
        lowStockProducts: 0,
    });
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Calculate date ranges
            const today = new Date().toISOString().split('T')[0];
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

            // Fetch all data in parallel for faster loading
            const [
                todayInvoicesResult,
                customerCountResult,
                pendingCountResult,
                employeeCountResult,
                servicesCountResult,
                productsResult,
                weekInvoicesResult
            ] = await Promise.all([
                // Today's invoices
                supabase
                    .from('invoices')
                    .select('total_amount')
                    .gte('created_at', `${today}T00:00:00`)
                    .lte('created_at', `${today}T23:59:59`),

                // Customer count
                supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true }),

                // Pending invoices count
                supabase
                    .from('invoices')
                    .select('*', { count: 'exact', head: true })
                    .eq('payment_status', 'pending'),

                // Employee count (for admin)
                isAdmin
                    ? supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true)
                    : Promise.resolve({ count: 0 }),

                // Active services count
                supabase
                    .from('services')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_active', true),

                // Products with stock info (single query for count + low stock)
                supabase
                    .from('products')
                    .select('id, stock_quantity, low_stock_threshold')
                    .eq('is_active', true),

                // All invoices from last 7 days (single query instead of 7)
                supabase
                    .from('invoices')
                    .select('total_amount, created_at')
                    .gte('created_at', `${sevenDaysAgoStr}T00:00:00`)
            ]);

            // Process today's revenue
            const todayRevenue = todayInvoicesResult.data?.reduce(
                (sum, inv) => sum + parseFloat(inv.total_amount || 0), 0
            ) || 0;

            // Process products data
            const productsData = productsResult.data || [];
            const productsCount = productsData.length;
            const lowStockCount = productsData.filter(
                p => p.stock_quantity <= p.low_stock_threshold
            ).length;

            // Process last 7 days revenue (client-side aggregation)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date.toISOString().split('T')[0];
            });

            const invoicesData = weekInvoicesResult.data || [];
            const revenueByDay = last7Days.map(date => {
                const dayInvoices = invoicesData.filter(inv =>
                    inv.created_at.startsWith(date)
                );
                const revenue = dayInvoices.reduce(
                    (sum, inv) => sum + parseFloat(inv.total_amount || 0), 0
                );
                return {
                    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    revenue
                };
            });

            setStats({
                todayRevenue,
                totalCustomers: customerCountResult.count || 0,
                pendingInvoices: pendingCountResult.count || 0,
                employeeCount: employeeCountResult.count || 0,
                totalServices: servicesCountResult.count || 0,
                totalProducts: productsCount,
                lowStockProducts: lowStockCount,
            });

            setRevenueData(revenueByDay);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();

        if (!customerFormData.name || !customerFormData.phone_number) {
            toast.error('Name and phone number are required');
            return;
        }

        try {
            setCustomerLoading(true);
            const { error } = await supabase
                .from('customers')
                .insert([customerFormData]);

            if (error) throw error;

            toast.success('Customer added successfully! Redirecting to billing...');
            setShowCustomerModal(false);
            setCustomerFormData({ name: '', phone_number: '', email: '', customer_type: 'new' });
            // Navigate to billing page after adding customer
            navigate('/billing');
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Failed to add customer');
        } finally {
            setCustomerLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, trend, isLoading }) => (
        <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {isLoading ? (
                        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
                    ) : (
                        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
                    )}
                    {trend && !isLoading && (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`h-12 w-12 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );

    // Skeleton loader for chart
    const ChartSkeleton = () => (
        <div className="card">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="h-80 bg-gray-100 rounded-lg flex items-end justify-around p-4 gap-2">
                {[...Array(7)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-200 rounded-t animate-pulse flex-1"
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                    ></div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {userProfile?.full_name}!
                </h1>
                <p className="text-gray-600 mt-1">Here's what's happening with your salon today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Revenue"
                    value={`₹${stats.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    color="bg-green-500"
                    isLoading={loading}
                />
                <StatCard
                    title="Total Customers"
                    value={stats.totalCustomers}
                    icon={UserCircle}
                    color="bg-blue-500"
                    isLoading={loading}
                />
                <StatCard
                    title="Pending Invoices"
                    value={stats.pendingInvoices}
                    icon={Receipt}
                    color="bg-yellow-500"
                    isLoading={loading}
                />
                {isAdmin && (
                    <StatCard
                        title="Active Employees"
                        value={stats.employeeCount}
                        icon={Users}
                        color="bg-purple-500"
                        isLoading={loading}
                    />
                )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Active Services"
                    value={stats.totalServices}
                    icon={Scissors}
                    color="bg-indigo-500"
                    isLoading={loading}
                />
                <StatCard
                    title="Products in Stock"
                    value={stats.totalProducts}
                    icon={Package}
                    color="bg-teal-500"
                    isLoading={loading}
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={stats.lowStockProducts}
                    icon={Package}
                    color="bg-red-500"
                    isLoading={loading}
                />
            </div>

            {/* Revenue Chart */}
            {loading ? (
                <ChartSkeleton />
            ) : (
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                                formatter={(value) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Quick Actions */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/billing')}
                        className="btn-primary flex items-center justify-center space-x-2"
                    >
                        <Receipt className="h-5 w-5" />
                        <span>New Invoice</span>
                    </button>
                    <button
                        onClick={() => setShowCustomerModal(true)}
                        className="btn-secondary flex items-center justify-center space-x-2"
                    >
                        <UserCircle className="h-5 w-5" />
                        <span>Add Customer</span>
                    </button>
                    <button
                        onClick={() => navigate('/attendance')}
                        className="btn-secondary flex items-center justify-center space-x-2"
                    >
                        <Calendar className="h-5 w-5" />
                        <span>Mark Attendance</span>
                    </button>
                </div>
            </div>

            {/* Add Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform animate-slideUp">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <UserPlus className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Add Customer</h3>
                            </div>
                            <button
                                onClick={() => setShowCustomerModal(false)}
                                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAddCustomer} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={customerFormData.name}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="Enter customer name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={customerFormData.phone_number}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, phone_number: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="10-digit phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={customerFormData.email}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="customer@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Customer Type
                                </label>
                                <select
                                    value={customerFormData.customer_type}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, customer_type: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                >
                                    <option value="new">New</option>
                                    <option value="regular">Regular</option>
                                    <option value="vip">VIP</option>
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={customerLoading}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {customerLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <UserPlus className="h-5 w-5 mr-2" />
                                            Add Customer
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

