import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportCustomersToXLSX } from '../utils/xlsxExport';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        email: '',
        customer_type: 'new'
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                const { error } = await supabase
                    .from('customers')
                    .update(formData)
                    .eq('id', editingCustomer.id);

                if (error) throw error;
                toast.success('Customer updated successfully');
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([formData]);

                if (error) throw error;
                toast.success('Customer added successfully');
            }

            setShowModal(false);
            setEditingCustomer(null);
            setFormData({ name: '', phone_number: '', email: '', customer_type: 'new' });
            fetchCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
            toast.error('Failed to save customer');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phone_number: customer.phone_number,
            email: customer.email || '',
            customer_type: customer.customer_type
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;

        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Customer deleted successfully');
            fetchCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error('Failed to delete customer');
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone_number.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-600 mt-1">Manage your customer base</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => {
                            if (customers.length === 0) {
                                toast.error('No customers to export');
                                return;
                            }
                            exportCustomersToXLSX(customers);
                            toast.success('Customers exported to Excel!');
                        }}
                        className="btn-secondary flex items-center space-x-2"
                    >
                        <Download className="h-5 w-5" />
                        <span>Export to Excel</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingCustomer(null);
                            setFormData({ name: '', phone_number: '', email: '', customer_type: 'new' });
                            setShowModal(true);
                        }}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Customer</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            {/* Customer List */}
            <div className="card overflow-hidden p-0">
                <div className="table-container">
                    <table className="table">
                        <thead className="table-header">
                            <tr>
                                <th className="table-header-cell">Name</th>
                                <th className="table-header-cell">Contact</th>
                                <th className="table-header-cell">Visits</th>
                                <th className="table-header-cell">Total Spent</th>
                                <th className="table-header-cell">Last Visit</th>
                                <th className="table-header-cell">Type</th>
                                <th className="table-header-cell">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="table-cell">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium text-gray-900">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex flex-col text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <Phone className="h-3 w-3 mr-1" />
                                                    {customer.phone_number}
                                                </span>
                                                {customer.email && (
                                                    <span className="flex items-center mt-1">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        {customer.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell">{customer.total_visits}</td>
                                        <td className="table-cell">₹{customer.total_spent?.toFixed(2) || '0.00'}</td>
                                        <td className="table-cell">
                                            {customer.last_visit_date ? new Date(customer.last_visit_date).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="table-cell">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${customer.customer_type === 'vip' ? 'bg-purple-100 text-purple-800' :
                                                    customer.customer_type === 'regular' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {customer.customer_type || 'new'}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Type
                                </label>
                                <select
                                    value={formData.customer_type}
                                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="new">New</option>
                                    <option value="regular">Regular</option>
                                    <option value="vip">VIP</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 mt-6">
                                <button type="submit" className="btn-primary flex-1">
                                    Save
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

export default Customers;
