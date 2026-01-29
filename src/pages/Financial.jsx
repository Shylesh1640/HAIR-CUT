import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const Financial = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0
    });
    const [expenses, setExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        category: 'other',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);

            // Calculate Total Income (from Invoices)
            const { data: incomeData, error: incomeError } = await supabase
                .from('invoices')
                .select('total_amount');

            // Handle case where table might not exist
            if (incomeError && incomeError.code === '42P01') {
                console.log('Invoices table does not exist yet');
                setSummary({ totalIncome: 0, totalExpenses: 0, netProfit: 0 });
                setLoading(false);
                return;
            }
            if (incomeError) throw incomeError;

            const totalIncome = incomeData?.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0) || 0;

            // Calculate Total Expenses
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .select('*')
                .order('expense_date', { ascending: false });

            // Handle case where expenses table might not exist
            if (expenseError && expenseError.code === '42P01') {
                console.log('Expenses table does not exist yet - please run the schema.sql');
                setExpenses([]);
                setSummary({ totalIncome, totalExpenses: 0, netProfit: totalIncome });
                toast.error('Expenses table not found. Please run schema.sql in Supabase.');
                setLoading(false);
                return;
            }
            if (expenseError) throw expenseError;

            setExpenses(expenseData || []);
            const totalExpenses = expenseData?.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) || 0;

            setSummary({
                totalIncome,
                totalExpenses,
                netProfit: totalIncome - totalExpenses
            });

        } catch (error) {
            console.error('Error fetching financial data:', error);
            toast.error('Failed to load financial data. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.description) {
            toast.error('Please fill in required fields');
            return;
        }

        try {
            const { error } = await supabase
                .from('expenses')
                .insert([{
                    ...newExpense,
                    created_by: userProfile.id
                }]);

            if (error) throw error;

            toast.success('Expense added successfully');
            setShowModal(false);
            setNewExpense({
                category: 'other',
                amount: '',
                description: '',
                expense_date: new Date().toISOString().split('T')[0]
            });
            fetchFinancialData();
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error('Failed to add expense');
        }
    };

    // Prepare Chart Data
    const expenseByCategory = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const pieData = Object.keys(expenseByCategory).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: expenseByCategory[key]
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
                    <p className="text-gray-600 mt-1">Track revenue, expenses, and profits</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add Expense</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-green-50 border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">₹{summary.totalIncome.toFixed(2)}</p>
                        </div>
                        <div className="h-10 w-10 bg-green-200 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-700" />
                        </div>
                    </div>
                </div>

                <div className="card bg-red-50 border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">₹{summary.totalExpenses.toFixed(2)}</p>
                        </div>
                        <div className="h-10 w-10 bg-red-200 rounded-full flex items-center justify-center">
                            <TrendingDown className="h-6 w-6 text-red-700" />
                        </div>
                    </div>
                </div>

                <div className="card bg-blue-50 border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Net Profit</p>
                            <p className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                {summary.netProfit >= 0 ? '' : '-'}₹{Math.abs(summary.netProfit).toFixed(2)}
                            </p>
                        </div>
                        <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-blue-700" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Distribution Chart */}
                <div className="card">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Expense Distribution</h2>
                    <div className="h-64 flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500">No expenses recorded yet</p>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {pieData.map((entry, index) => (
                            <div key={index} className="flex items-center space-x-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-xs text-gray-600">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Expenses List */}
                <div className="card">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Expenses</h2>
                    <div className="overflow-y-auto max-h-64 space-y-3">
                        {expenses.length > 0 ? (
                            expenses.map((expense) => (
                                <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{expense.description}</p>
                                        <p className="text-xs text-gray-500 capitalize">{expense.category} • {expense.expense_date}</p>
                                    </div>
                                    <span className="font-bold text-red-600">-₹{expense.amount.toFixed(2)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No recent expenses</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Expense</h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g. Shop Rent"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={newExpense.amount}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={newExpense.expense_date}
                                        onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="rent">Rent</option>
                                    <option value="salary">Salary</option>
                                    <option value="electricity">Electricity</option>
                                    <option value="supplies">Supplies</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button type="submit" className="btn-primary flex-1">
                                    Add Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
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

export default Financial;
