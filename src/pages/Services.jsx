import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Search, Plus, Edit, Trash2, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        min_price: '',
        max_price: '',
        is_active: true
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('name');

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingService) {
                const { error } = await supabase
                    .from('services')
                    .update(formData)
                    .eq('id', editingService.id);

                if (error) throw error;
                toast.success('Service updated successfully');
            } else {
                const { error } = await supabase
                    .from('services')
                    .insert([formData]);

                if (error) throw error;
                toast.success('Service added successfully');
            }

            setShowModal(false);
            setEditingService(null);
            setFormData({ name: '', description: '', min_price: '', max_price: '', is_active: true });
            fetchServices();
        } catch (error) {
            console.error('Error saving service:', error);
            toast.error('Failed to save service');
        }
    };

    const handleEdit = (service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            description: service.description || '',
            min_price: service.min_price,
            max_price: service.max_price,
            is_active: service.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;

        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Service deleted successfully');
            fetchServices();
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Failed to delete service');
        }
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Services</h1>
                    <p className="text-gray-600 mt-1">Manage your salon services and pricing</p>
                </div>
                <button
                    onClick={() => {
                        setEditingService(null);
                        setFormData({ name: '', description: '', min_price: '', max_price: '', is_active: true });
                        setShowModal(true);
                    }}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add Service</span>
                </button>
            </div>

            <div className="card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search services..."
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
                ) : filteredServices.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No services found
                    </div>
                ) : (
                    filteredServices.map((service) => (
                        <div key={service.id} className="card hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                                        <Scissors className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{service.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {service.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(service)}
                                        className="text-gray-400 hover:text-blue-600"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {service.description || 'No description available'}
                            </p>

                            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                                <div className="text-sm text-gray-500">Price Range</div>
                                <div className="font-bold text-gray-900">
                                    ₹{service.min_price} - ₹{service.max_price}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingService ? 'Edit Service' : 'Add New Service'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Service Name *
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
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field min-h-[80px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Min Price *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.min_price}
                                        onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Price *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.max_price}
                                        onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                    Active Service
                                </label>
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

export default Services;
