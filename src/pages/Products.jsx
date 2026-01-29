import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        low_stock_threshold: 10,
        is_active: true
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(formData)
                    .eq('id', editingProduct.id);

                if (error) throw error;
                toast.success('Product updated successfully');
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([formData]);

                if (error) throw error;
                toast.success('Product added successfully');
            }

            setShowModal(false);
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                stock_quantity: '',
                low_stock_threshold: 10,
                is_active: true
            });
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            stock_quantity: product.stock_quantity,
            low_stock_threshold: product.low_stock_threshold,
            is_active: product.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    const updateStock = async (id, newQuantity) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ stock_quantity: newQuantity })
                .eq('id', id);

            if (error) throw error;
            toast.success('Stock updated');
            fetchProducts();
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error('Failed to update stock');
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-600 mt-1">Manage inventory and stock levels</p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setFormData({
                            name: '',
                            description: '',
                            price: '',
                            stock_quantity: '',
                            low_stock_threshold: 10,
                            is_active: true
                        });
                        setShowModal(true);
                    }}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add Product</span>
                </button>
            </div>

            <div className="card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            <div className="card overflow-hidden p-0">
                <div className="table-container">
                    <table className="table">
                        <thead className="table-header">
                            <tr>
                                <th className="table-header-cell">Product Name</th>
                                <th className="table-header-cell">Price</th>
                                <th className="table-header-cell">Stock Level</th>
                                <th className="table-header-cell">Status</th>
                                <th className="table-header-cell">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="table-cell">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{product.name}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-xs">
                                                        {product.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="table-cell font-medium">₹{product.price}</td>
                                        <td className="table-cell">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => updateStock(product.id, Math.max(0, product.stock_quantity - 1))}
                                                    className="text-gray-400 hover:text-gray-600 px-1"
                                                >-</button>
                                                <span className={`font-medium ${product.stock_quantity <= product.low_stock_threshold
                                                        ? 'text-red-600'
                                                        : 'text-gray-900'
                                                    }`}>
                                                    {product.stock_quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateStock(product.id, product.stock_quantity + 1)}
                                                    className="text-gray-400 hover:text-gray-600 px-1"
                                                >+</button>
                                                {product.stock_quantity <= product.low_stock_threshold && (
                                                    <div className="relative group">
                                                        <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                            Low Stock (Threshold: {product.low_stock_threshold})
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
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

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name *
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
                                    className="input-field min-h-[60px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Initial Stock *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Low Stock Alert At
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.low_stock_threshold}
                                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                        Active Product
                                    </label>
                                </div>
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

export default Products;
