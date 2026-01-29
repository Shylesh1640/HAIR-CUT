import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FileDown, Calendar, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const generateAttendanceReport = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('attendance')
                .select(`
          date,
          check_in,
          check_out,
          status,
          user:users (full_name, employee_id)
        `)
                .gte('date', dateRange.start)
                .lte('date', dateRange.end)
                .order('date', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                toast('No attendance records found for this period');
                return;
            }

            const reportData = data.map(record => ({
                Date: record.date,
                'Employee Name': record.user?.full_name || 'N/A',
                'Employee ID': record.user?.employee_id || 'N/A',
                'Check In': record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '-',
                'Check Out': record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '-',
                Status: record.status
            }));

            downloadExcel(reportData, `Attendance_Report_${dateRange.start}_to_${dateRange.end}`);
            toast.success('Attendance report downloaded');
        } catch (error) {
            console.error('Error generating attendance report:', error);
            toast.error('Failed to generate attendance report');
        } finally {
            setLoading(false);
        }
    };

    const generateSalesReport = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select(`
          invoice_number,
          created_at,
          customer:customers (name),
          subtotal,
          gst_amount,
          discount,
          total_amount,
          payment_status
        `)
                .gte('created_at', `${dateRange.start}T00:00:00`)
                .lte('created_at', `${dateRange.end}T23:59:59`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                toast('No sales records found for this period');
                return;
            }

            const reportData = data.map(inv => ({
                Date: format(new Date(inv.created_at), 'yyyy-MM-dd'),
                'Invoice #': inv.invoice_number,
                Customer: inv.customer?.name || 'Walk-in',
                Subtotal: inv.subtotal,
                GST: inv.gst_amount,
                Discount: inv.discount,
                Total: inv.total_amount,
                Status: inv.payment_status
            }));

            downloadExcel(reportData, `Sales_Report_${dateRange.start}_to_${dateRange.end}`);
            toast.success('Sales report downloaded');
        } catch (error) {
            console.error('Error generating sales report:', error);
            toast.error('Failed to generate sales report');
        } finally {
            setLoading(false);
        }
    };

    const generateProfitLossReport = async () => {
        try {
            setLoading(true);

            // Fetch Revenue
            const { data: invoices, error: invError } = await supabase
                .from('invoices')
                .select('total_amount')
                .gte('created_at', `${dateRange.start}T00:00:00`)
                .lte('created_at', `${dateRange.end}T23:59:59`);

            if (invError) throw invError;

            const totalRevenue = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

            // Fetch Expenses
            const { data: expenses, error: expError } = await supabase
                .from('expenses')
                .select('*')
                .gte('expense_date', dateRange.start)
                .lte('expense_date', dateRange.end);

            if (expError) throw expError;

            const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

            // Group expenses by category
            const expenseBreakdown = expenses?.reduce((acc, curr) => {
                acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                return acc;
            }, {});

            const reportData = [
                { Item: 'Total Revenue', Amount: totalRevenue },
                { Item: 'Total Expenses', Amount: totalExpenses },
                { Item: '----------------', Amount: '----' },
                { Item: 'NET PROFIT/LOSS', Amount: totalRevenue - totalExpenses },
                { Item: '', Amount: '' },
                { Item: 'Expense Breakdown:', Amount: '' },
                ...Object.entries(expenseBreakdown || {}).map(([cat, amt]) => ({
                    Item: cat.charAt(0).toUpperCase() + cat.slice(1),
                    Amount: amt
                }))
            ];

            downloadExcel(reportData, `Profit_Loss_Report_${dateRange.start}_to_${dateRange.end}`);
            toast.success('P&L report downloaded');
        } catch (error) {
            console.error('Error generating P&L report:', error);
            toast.error('Failed to generate P&L report');
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = (data, fileName) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-600 mt-1">Generate and download business reports</p>
            </div>

            {/* Date Filter */}
            <div className="card">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Select Date Range
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="input-field"
                        />
                    </div>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Attendance Report */}
                <div className="card hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Attendance Report</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Employee check-in/out logs and status
                            </p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-100" />
                    </div>
                    <button
                        onClick={generateAttendanceReport}
                        disabled={loading}
                        className="btn-primary w-full mt-6 flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <span className="text-sm">Processing...</span>
                        ) : (
                            <>
                                <FileDown className="h-4 w-4" />
                                <span>Download Excel</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Sales Report */}
                <div className="card hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Sales Report</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Comprehensive invoice list containing revenue details
                            </p>
                        </div>
                        <FileText className="h-8 w-8 text-green-100" />
                    </div>
                    <button
                        onClick={generateSalesReport}
                        disabled={loading}
                        className="btn-primary w-full mt-6 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                        {loading ? (
                            <span className="text-sm">Processing...</span>
                        ) : (
                            <>
                                <FileDown className="h-4 w-4" />
                                <span>Download Excel</span>
                            </>
                        )}
                    </button>
                </div>

                {/* P&L Statement */}
                <div className="card hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Profit & Loss</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Income vs Expenses analysis summary
                            </p>
                        </div>
                        <FileText className="h-8 w-8 text-purple-100" />
                    </div>
                    <button
                        onClick={generateProfitLossReport}
                        disabled={loading}
                        className="btn-primary w-full mt-6 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700"
                    >
                        {loading ? (
                            <span className="text-sm">Processing...</span>
                        ) : (
                            <>
                                <FileDown className="h-4 w-4" />
                                <span>Download Excel</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Reports;
