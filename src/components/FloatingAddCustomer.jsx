import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import toast from 'react-hot-toast';

const FloatingAddCustomer = () => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        email: '',
        customer_type: 'new'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.phone_number) {
            toast.error('Name and phone number are required');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('customers')
                .insert([formData]);

            if (error) throw error;

            toast.success('Customer added successfully!');
            setShowModal(false);
            setFormData({ name: '', phone_number: '', email: '', customer_type: 'new' });
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Failed to add customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-6 right-6 z-40 group"
                title="Add New Customer"
            >
                <div className="relative">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>

                    {/* Button */}
                    <div className="relative flex items-center justify-center h-14 w-14 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full shadow-2xl hover:shadow-primary-500/50 transform hover:scale-110 transition-all duration-300 cursor-pointer">
                        <UserPlus className="h-6 w-6 text-white" />
                    </div>
                </div>

                {/* Tooltip */}
                <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                    Add New Customer
                </span>
            </button>

            {/* Modal */}
            {showModal && (
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
                                onClick={() => setShowModal(false)}
                                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
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
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="customer@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Customer Type
                                </label>
                                <select
                                    value={formData.customer_type}
                                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
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
                                    disabled={loading}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading ? (
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
        </>
    );
};

export default FloatingAddCustomer;
