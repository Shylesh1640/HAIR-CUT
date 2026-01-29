import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Attendance = () => {
    const { userProfile, isAdmin } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate, isAdmin]); // Fetch when date changes or role loads

    const fetchAttendance = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('attendance')
                .select(`
          *,
          user:users (full_name, employee_id)
        `)
                .eq('date', selectedDate);

            // If not admin, only show own attendance for history, 
            // but for "today's action" we check separately.
            if (!isAdmin) {
                query = query.eq('user_id', userProfile?.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setAttendance(data || []);

            // Check for today's record for the current user
            if (selectedDate === new Date().toISOString().split('T')[0]) {
                const myRecord = data?.find(r => r.user_id === userProfile?.id);
                setTodayRecord(myRecord);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to load attendance');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!userProfile) return;

        try {
            const now = new Date();
            const { data, error } = await supabase
                .from('attendance')
                .insert([{
                    user_id: userProfile.id,
                    date: now.toISOString().split('T')[0],
                    check_in: now.toISOString(),
                    status: 'present'
                }])
                .select()
                .single();

            if (error) throw error;

            setTodayRecord(data);
            fetchAttendance();
            toast.success('Checked in successfully!');
        } catch (error) {
            console.error('Check-in error:', error);
            toast.error('Failed to check in');
        }
    };

    const handleCheckOut = async () => {
        if (!todayRecord) return;

        try {
            const now = new Date();
            const { error } = await supabase
                .from('attendance')
                .update({
                    check_out: now.toISOString()
                })
                .eq('id', todayRecord.id);

            if (error) throw error;

            fetchAttendance();
            toast.success('Checked out successfully!');
        } catch (error) {
            console.error('Check-out error:', error);
            toast.error('Failed to check out');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
                    <p className="text-gray-600 mt-1">Track employee check-ins and check-outs</p>
                </div>

                <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300 px-3 py-2">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="outline-none text-gray-700 bg-transparent"
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            {/* Today's Action Panel */}
            {selectedDate === new Date().toISOString().split('T')[0] && (
                <div className="card bg-gradient-to-r from-indigo-500 to-primary-600 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-center p-2">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Today's Status</h2>
                            <p className="text-blue-100 mb-4 sm:mb-0">
                                {todayRecord
                                    ? todayRecord.check_out
                                        ? "Shift Completed"
                                        : "Currently Working"
                                    : "Not Checked In"}
                            </p>
                        </div>

                        <div className="flex space-x-4">
                            {!todayRecord ? (
                                <button
                                    onClick={handleCheckIn}
                                    className="bg-white text-primary-600 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors flex items-center"
                                >
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Check In
                                </button>
                            ) : !todayRecord.check_out ? (
                                <button
                                    onClick={handleCheckOut}
                                    className="bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-600 transition-colors flex items-center"
                                >
                                    <XCircle className="h-5 w-5 mr-2" />
                                    Check Out
                                </button>
                            ) : (
                                <div className="bg-white bg-opacity-20 px-6 py-3 rounded-lg text-center">
                                    <p className="font-semibold">Have a good rest!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance List */}
            <div className="card overflow-hidden p-0">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900">
                        Attendance Log - {format(new Date(selectedDate), 'MMMM do, yyyy')}
                    </h3>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead className="table-header">
                            <tr>
                                <th className="table-header-cell">Employee Name</th>
                                <th className="table-header-cell">Date</th>
                                <th className="table-header-cell">Check In</th>
                                <th className="table-header-cell">Check Out</th>
                                <th className="table-header-cell">Status</th>
                                <th className="table-header-cell">Total Hours</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : attendance.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        No records found for this date
                                    </td>
                                </tr>
                            ) : (
                                attendance.map((record) => {
                                    const checkIn = record.check_in ? new Date(record.check_in) : null;
                                    const checkOut = record.check_out ? new Date(record.check_out) : null;

                                    // Calculate hours
                                    let duration = '-';
                                    if (checkIn && checkOut) {
                                        const diff = (checkOut - checkIn) / (1000 * 60 * 60); // hours
                                        duration = `${diff.toFixed(1)} hrs`;
                                    } else if (checkIn) {
                                        duration = 'In Progress';
                                    }

                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="table-cell font-medium">
                                                {record.user?.full_name || 'Unknown User'}
                                                {record.user?.employee_id && <span className="text-gray-500 text-xs ml-1">({record.user.employee_id})</span>}
                                            </td>
                                            <td className="table-cell">
                                                {format(new Date(record.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="table-cell text-green-600">
                                                {checkIn ? format(checkIn, 'hh:mm a') : '-'}
                                            </td>
                                            <td className="table-cell text-red-600">
                                                {checkOut ? format(checkOut, 'hh:mm a') : '-'}
                                            </td>
                                            <td className="table-cell">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'half_day' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="table-cell text-gray-500">
                                                {duration}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
