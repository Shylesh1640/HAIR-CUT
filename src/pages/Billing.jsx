import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Minus,
    Search,
    Printer,
    Download,
    X,
    ShoppingCart,
    User,
    Scissors,
    Package,
    CheckCircle,
    CreditCard,
    FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { exportBillingToXLSX } from '../utils/xlsxExport';
import FloatingAddCustomer from '../components/FloatingAddCustomer';

const Billing = () => {
    const { userProfile } = useAuth();
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);

    // Invoice state
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone_number: '', email: '' });

    // Cart state
    const [cartItems, setCartItems] = useState([]);
    const [isGSTInvoice, setIsGSTInvoice] = useState(true);
    const [gstPercentage, setGstPercentage] = useState(18);
    const [discount, setDiscount] = useState(0);

    // Payment state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, card, upi
    const [paymentAmount, setPaymentAmount] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch services
            const { data: servicesData } = await supabase
                .from('services')
                .select('*')
                .eq('is_active', true);
            setServices(servicesData || []);

            // Fetch products
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true);
            setProducts(productsData || []);

            // Fetch customers
            const { data: customersData } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });
            setCustomers(customersData || []);

            // Fetch invoices with customer info for export
            const { data: invoicesData } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customers (name, phone_number)
                `)
                .order('created_at', { ascending: false });

            // Transform invoices data for export
            const transformedInvoices = invoicesData?.map(inv => ({
                ...inv,
                customer_name: inv.customers?.name || 'Walk-in',
                customer_phone: inv.customers?.phone_number || 'N/A'
            })) || [];
            setInvoices(transformedInvoices);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        }
    };

    const addToCart = (item, type) => {
        const existingItem = cartItems.find(
            (cartItem) => cartItem.item_id === item.id && cartItem.item_type === type
        );

        if (existingItem) {
            setCartItems(
                cartItems.map((cartItem) =>
                    cartItem.item_id === item.id && cartItem.item_type === type
                        ? { ...cartItem, quantity: cartItem.quantity + 1, total_price: cartItem.unit_price * (cartItem.quantity + 1) }
                        : cartItem
                )
            );
        } else {
            const price = type === 'service' ? item.min_price : item.price;
            setCartItems([
                ...cartItems,
                {
                    item_id: item.id,
                    item_name: item.name,
                    item_type: type,
                    quantity: 1,
                    unit_price: parseFloat(price),
                    total_price: parseFloat(price),
                },
            ]);
        }
        toast.success(`${item.name} added to cart`);
    };

    const updateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) return;

        setCartItems(
            cartItems.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        quantity: newQuantity,
                        total_price: item.unit_price * newQuantity,
                    }
                    : item
            )
        );
    };

    const removeFromCart = (index) => {
        setCartItems(cartItems.filter((_, i) => i !== index));
        toast.success('Item removed from cart');
    };

    const calculateTotals = () => {
        const subtotal = cartItems.reduce((sum, item) => sum + item.total_price, 0);
        const gstAmount = isGSTInvoice ? (subtotal * gstPercentage) / 100 : 0;
        const total = subtotal + gstAmount - discount;

        return { subtotal, gstAmount, total };
    };

    const createCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phone_number) {
            toast.error('Name and phone number are required');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('customers')
                .insert([newCustomer])
                .select()
                .single();

            if (error) throw error;

            setCustomers([data, ...customers]);
            setSelectedCustomer(data);
            setShowCustomerModal(false);
            setNewCustomer({ name: '', phone_number: '', email: '' });
            toast.success('Customer created successfully');
        } catch (error) {
            console.error('Error creating customer:', error);
            toast.error('Failed to create customer');
        }
    };

    const generateInvoice = async () => {
        if (!selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }

        if (cartItems.length === 0) {
            toast.error('Please add items to cart');
            return;
        }

        try {
            const { subtotal, gstAmount, total } = calculateTotals();

            // Generate invoice number
            const invoiceNumber = `INV-${Date.now()}`;

            // Create invoice
            const invoicePayload = {
                invoice_number: invoiceNumber,
                customer_id: selectedCustomer.id,
                created_by: userProfile.id,
                subtotal,
                gst_percentage: isGSTInvoice ? gstPercentage : 0,
                gst_amount: gstAmount,
                discount,
                total_amount: total,
                payment_status: 'pending',
                is_gst_invoice: isGSTInvoice,
            };

            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert([invoicePayload])
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // Create invoice items
            const invoiceItems = cartItems.map((item) => ({
                invoice_id: invoiceData.id,
                item_type: item.item_type,
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
            }));

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(invoiceItems);

            if (itemsError) throw itemsError;

            // Update product stock
            for (const item of cartItems) {
                if (item.item_type === 'product') {
                    const product = products.find((p) => p.id === item.item_id);
                    if (product) {
                        // Basic optimism here, real app needs better concurrency handling
                        await supabase
                            .from('products')
                            .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
                            .eq('id', item.item_id);
                    }
                }
            }

            toast.success('Invoice created!');
            setCurrentInvoice({ ...invoicePayload, id: invoiceData.id, items: invoiceItems });
            setPaymentAmount(total); // Default full payment
            setShowPaymentModal(true);

            // Reset form (keep customer?)
            setCartItems([]);
            setDiscount(0);

        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error('Failed to create invoice');
        }
    };

    const processPayment = async () => {
        if (!currentInvoice) return;

        try {
            // Record payment
            const { error: paymentError } = await supabase
                .from('payments')
                .insert([{
                    invoice_id: currentInvoice.id,
                    payment_method: paymentMethod,
                    amount: paymentAmount,
                    payment_date: new Date().toISOString()
                }]);

            if (paymentError) throw paymentError;

            // Update invoice status
            const newStatus = paymentAmount >= currentInvoice.total_amount ? 'paid' : 'partial';

            const { error: updateError } = await supabase
                .from('invoices')
                .update({ payment_status: newStatus })
                .eq('id', currentInvoice.id);

            if (updateError) throw updateError;

            // Update customer stats
            if (selectedCustomer) {
                await supabase
                    .from('customers')
                    .update({
                        total_visits: selectedCustomer.total_visits + 1,
                        total_spent: selectedCustomer.total_spent + parseFloat(paymentAmount),
                        last_visit_date: new Date().toISOString().split('T')[0],
                    })
                    .eq('id', selectedCustomer.id);
            }

            toast.success('Payment recorded successfully');
            setShowPaymentModal(false);
            setSelectedCustomer(null);
            setCurrentInvoice(null);

        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Failed to record payment');
        }
    };

    const generatePDF = (invoice) => {
        if (!invoice) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text('Salon Management System', 20, 20);
        doc.setFontSize(12);
        doc.text('123 Beauty Lane, City, Country', 20, 30);
        doc.text('Phone: +91 98765 43210', 20, 36);

        doc.line(20, 42, 190, 42); // Horizontal line

        // Invoice Info
        doc.setFontSize(14);
        doc.text('INVOICE', 140, 30);
        doc.setFontSize(10);
        doc.text(`# ${invoice.invoice_number}`, 140, 36);
        doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 140, 42);

        // Customer Info
        if (selectedCustomer) {
            doc.text('Bill To:', 20, 55);
            doc.setFontSize(12);
            doc.text(selectedCustomer.name, 20, 62);
            doc.setFontSize(10);
            doc.text(selectedCustomer.phone_number, 20, 68);
        }

        // Items Table Header
        let y = 85;
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y - 5, 170, 8, 'F');
        doc.font = 'helvetica';
        doc.setFont(undefined, 'bold');
        doc.text('Item', 25, y);
        doc.text('Qty', 100, y);
        doc.text('Rate', 130, y);
        doc.text('Amount', 160, y);
        doc.setFont(undefined, 'normal');

        // Items
        y += 10;
        invoice.items?.forEach(item => {
            doc.text(item.item_name, 25, y);
            doc.text(item.quantity.toString(), 105, y);
            doc.text(item.unit_price.toFixed(2), 130, y);
            doc.text(item.total_price.toFixed(2), 160, y);
            y += 8;
        });

        doc.line(20, y, 190, y);
        y += 10;

        // Totals
        doc.text('Subtotal:', 130, y);
        doc.text(invoice.subtotal.toFixed(2), 160, y);
        y += 6;

        if (invoice.gst_amount > 0) {
            doc.text(`GST (${invoice.gst_percentage}%):`, 130, y);
            doc.text(invoice.gst_amount.toFixed(2), 160, y);
            y += 6;
        }

        if (invoice.discount > 0) {
            doc.text('Discount:', 130, y);
            doc.text(`-${invoice.discount.toFixed(2)}`, 160, y);
            y += 6;
        }

        doc.setFont(undefined, 'bold');
        doc.text('Total:', 130, y + 2);
        doc.text(invoice.total_amount.toFixed(2), 160, y + 2);

        doc.save(`${invoice.invoice_number}.pdf`);
    };

    const { subtotal, gstAmount, total } = calculateTotals();

    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            customer.phone_number.includes(customerSearch)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
                    <p className="text-gray-600 mt-1">Create new invoices and manage payments</p>
                </div>
                <button
                    onClick={() => {
                        if (invoices.length === 0) {
                            toast.error('No invoices to export');
                            return;
                        }
                        exportBillingToXLSX(invoices);
                        toast.success('Invoices exported to Excel!');
                    }}
                    className="btn-secondary flex items-center space-x-2"
                >
                    <FileSpreadsheet className="h-5 w-5" />
                    <span>Export Invoices</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Services & Products */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Selection */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Customer
                        </h2>

                        {selectedCustomer ? (
                            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                                    <p className="text-sm text-gray-600">{selectedCustomer.phone_number}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search customer by name or phone..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="input-field pl-10"
                                    />
                                </div>

                                {customerSearch && (
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((customer) => (
                                                <button
                                                    key={customer.id}
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setCustomerSearch('');
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <p className="font-medium text-gray-900">{customer.name}</p>
                                                    <p className="text-sm text-gray-600">{customer.phone_number}</p>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">
                                                No customers found
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="btn-secondary w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2 inline" />
                                    Add New Customer
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Services */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Scissors className="h-5 w-5 mr-2" />
                            Services
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => addToCart(service, 'service')}
                                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                                >
                                    <p className="font-medium text-gray-900">{service.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        ₹{service.min_price} - ₹{service.max_price}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Products */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Package className="h-5 w-5 mr-2" />
                            Products
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {products.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product, 'product')}
                                    disabled={product.stock_quantity === 0}
                                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <p className="font-medium text-gray-900">{product.name}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-sm text-gray-600">₹{product.price}</p>
                                        <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Cart & Summary */}
                <div className="space-y-6">
                    {/* Cart */}
                    <div className="card sticky top-24">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Cart ({cartItems.length})
                        </h2>

                        {cartItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Cart Items */}
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {cartItems.map((item, index) => (
                                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 text-sm">{item.item_name}</p>
                                                    <p className="text-xs text-gray-600 capitalize">{item.item_type}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => updateQuantity(index, item.quantity - 1)}
                                                        className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-100"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="text-sm font-medium w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(index, item.quantity + 1)}
                                                        className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-100"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    ₹{item.total_price.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* GST Toggle */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">GST Invoice</label>
                                    <input
                                        type="checkbox"
                                        checked={isGSTInvoice}
                                        onChange={(e) => setIsGSTInvoice(e.target.checked)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                </div>

                                {isGSTInvoice && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <label className="text-sm font-medium text-gray-700 block mb-2">
                                            GST Percentage
                                        </label>
                                        <input
                                            type="number"
                                            value={gstPercentage}
                                            onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                                            className="input-field"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                )}

                                {/* Discount */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Discount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        className="input-field"
                                        min="0"
                                    />
                                </div>

                                {/* Summary */}
                                <div className="border-t border-gray-200 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    {isGSTInvoice && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">GST ({gstPercentage}%)</span>
                                            <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Discount</span>
                                            <span className="font-medium text-red-600">-₹{discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                                        <span>Total</span>
                                        <span className="text-primary-600">₹{total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <button
                                        onClick={generateInvoice}
                                        className="btn-primary w-full"
                                    >
                                        Generate Invoice
                                    </button>
                                    <button
                                        onClick={() => setCartItems([])}
                                        className="btn-secondary w-full"
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Customer</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    className="input-field"
                                    placeholder="Customer name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={newCustomer.phone_number}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
                                    className="input-field"
                                    placeholder="10-digit phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    className="input-field"
                                    placeholder="customer@example.com"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button onClick={createCustomer} className="btn-primary flex-1">
                                Create Customer
                            </button>
                            <button
                                onClick={() => {
                                    setShowCustomerModal(false);
                                    setNewCustomer({ name: '', phone_number: '', email: '' });
                                }}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Success Modal */}
            {showPaymentModal && currentInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="text-center mb-6">
                            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Invoice Created</h3>
                            <p className="text-gray-600">Total Amount: ₹{currentInvoice.total_amount.toFixed(2)}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI/QR</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount Received
                                </label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                                    className="input-field"
                                />
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={processPayment}
                                    className="btn-primary flex-1"
                                >
                                    Confirm Payment
                                </button>
                                <button
                                    onClick={() => generatePDF(currentInvoice)}
                                    className="btn-secondary flex items-center justify-center px-4"
                                    title="Download Invoice"
                                >
                                    <Download className="h-5 w-5" />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
                            >
                                Pay Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Add Customer Button */}
            <FloatingAddCustomer />
        </div>
    );
};

export default Billing;

