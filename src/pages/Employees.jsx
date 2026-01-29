import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, Shield, X, UserPlus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Employees = () => {
    const { isAdmin } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        password: '',
        role: 'employee',
        employee_id: '',
        is_active: true
    });
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const generateEmployeeId = () => {
        const prefix = 'EMP';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}${randomNum}`;
    };

    const handleAdd = () => {
        setEditingEmployee(null);
        setFormData({
            full_name: '',
            email: '',
            phone_number: '',
            password: '',
            role: 'employee',
            employee_id: generateEmployeeId(),
            is_active: true
        });
        setModalMode('add');
        setShowModal(true);
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            full_name: employee.full_name || '',
            email: employee.email || '',
            phone_number: employee.phone_number || '',
            password: '', // Password not editable for security
            role: employee.role || 'employee',
            employee_id: employee.employee_id || '',
            is_active: employee.is_active !== false
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleDeleteClick = (employee) => {
        setEmployeeToDelete(employee);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!employeeToDelete) return;

        try {
            setSubmitting(true);
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', employeeToDelete.id);

            if (error) throw error;

            toast.success(`${employeeToDelete.full_name || 'Employee'} has been removed`);
            setShowDeleteModal(false);
            setEmployeeToDelete(null);
            fetchEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.error('Failed to delete employee');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (modalMode === 'add') {
                // Validate required fields
                if (!formData.full_name.trim()) {
                    toast.error('Full name is required');
                    setSubmitting(false);
                    return;
                }
                if (!formData.email.trim()) {
                    toast.error('Email is required');
                    setSubmitting(false);
                    return;
                }
                if (!formData.password || formData.password.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    setSubmitting(false);
                    return;
                }

                // Check if email already exists
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', formData.email.toLowerCase())
                    .single();

                if (existingUser) {
                    toast.error('An employee with this email already exists');
                    setSubmitting(false);
                    return;
                }

                // Insert new employee directly into users table
                const { error } = await supabase
                    .from('users')
                    .insert([{
                        full_name: formData.full_name.trim(),
                        email: formData.email.toLowerCase().trim(),
                        phone_number: formData.phone_number.trim() || null,
                        password: formData.password, // In demo mode, plain text
                        role: formData.role,
                        employee_id: formData.employee_id || generateEmployeeId(),
                        is_active: formData.is_active
                    }]);

                if (error) throw error;
                toast.success('Employee added successfully!');

            } else if (editingEmployee) {
                // Update existing employee
                const updateData = {
                    full_name: formData.full_name.trim(),
                    phone_number: formData.phone_number.trim() || null,
                    role: formData.role,
                    employee_id: formData.employee_id,
                    is_active: formData.is_active
                };

                // Only update password if provided
                if (formData.password && formData.password.length >= 6) {
                    updateData.password = formData.password;
                }

                const { error } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', editingEmployee.id);

                if (error) throw error;
                toast.success('Employee updated successfully!');
            }

            setShowModal(false);
            setEditingEmployee(null);
            setFormData({
                full_name: '', email: '', phone_number: '', password: '',
                role: 'employee', employee_id: '', is_active: true
            });
            fetchEmployees();
        } catch (error) {
            console.error('Error saving employee:', error);
            toast.error(error.message || 'Failed to save employee');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(employee =>
        employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
                    <p className="text-gray-600 mt-1">Manage staff access and profiles</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleAdd}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Employee</span>
                    </button>
                )}
            </div>

            <div className="card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No employees found</p>
                        {isAdmin && (
                            <button
                                onClick={handleAdd}
                                className="mt-4 btn-primary inline-flex items-center space-x-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add First Employee</span>
                            </button>
                        )}
                    </div>
                ) : (
                    filteredEmployees.map((employee) => (
                        <div key={employee.id} className="card hover:shadow-lg transition-shadow relative group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${employee.role === 'admin'
                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                            : 'bg-primary-100 text-primary-600'
                                        }`}>
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{employee.full_name || 'No Name'}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${employee.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {employee.role}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${employee.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {employee.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(employee)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Employee"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(employee)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove Employee"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="truncate">{employee.email}</span>
                                </div>
                                {employee.phone_number && (
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{employee.phone_number}</span>
                                    </div>
                                )}
                                {employee.employee_id && (
                                    <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{employee.employee_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Employee Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform animate-slideUp max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <UserPlus className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {modalMode === 'add' ? 'Add Employee' : 'Edit Employee'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    disabled={modalMode === 'edit'}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${modalMode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    placeholder="employee@salon.com"
                                />
                                {modalMode === 'edit' && (
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {modalMode === 'add' ? 'Password *' : 'New Password (leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    required={modalMode === 'add'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder={modalMode === 'add' ? 'Minimum 6 characters' : '••••••••'}
                                    minLength={modalMode === 'add' ? 6 : 0}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors font-mono"
                                        placeholder="EMP001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        placeholder="10-digit number"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-700">
                                    Active Account
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {submitting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            {modalMode === 'add' ? <UserPlus className="h-5 w-5 mr-2" /> : <Edit className="h-5 w-5 mr-2" />}
                                            {modalMode === 'add' ? 'Add Employee' : 'Save Changes'}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && employeeToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform animate-slideUp">
                        <div className="flex items-center justify-center mb-6">
                            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            Remove Employee?
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            Are you sure you want to remove <strong>{employeeToDelete.full_name}</strong>?
                            This action cannot be undone and they will lose access to the system.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={submitting}
                                className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {submitting ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Trash2 className="h-5 w-5 mr-2" />
                                        Yes, Remove
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setEmployeeToDelete(null);
                                }}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
