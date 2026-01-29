import * as XLSX from 'xlsx';

/**
 * Export data to an XLSX file
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 * @param {string} sheetName - Name of the sheet
 */
export const exportToXLSX = (data, fileName, sheetName = 'Sheet1') => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate and download the file
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Export customers data to XLSX
 * @param {Array} customers - Array of customer objects
 */
export const exportCustomersToXLSX = (customers) => {
    const formattedData = customers.map(customer => ({
        'Customer ID': customer.id,
        'Name': customer.name,
        'Phone Number': customer.phone_number,
        'Email': customer.email || 'N/A',
        'Customer Type': customer.customer_type || 'new',
        'Total Visits': customer.total_visits || 0,
        'Total Spent (₹)': customer.total_spent?.toFixed(2) || '0.00',
        'Last Visit Date': customer.last_visit_date || 'Never',
        'Created At': customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'
    }));

    const date = new Date().toISOString().split('T')[0];
    exportToXLSX(formattedData, `customers_${date}`, 'Customers');
};

/**
 * Export billing/invoices data to XLSX
 * @param {Array} invoices - Array of invoice objects
 */
export const exportBillingToXLSX = (invoices) => {
    const formattedData = invoices.map(invoice => ({
        'Invoice Number': invoice.invoice_number,
        'Customer Name': invoice.customer_name || 'N/A',
        'Customer Phone': invoice.customer_phone || 'N/A',
        'Subtotal (₹)': invoice.subtotal?.toFixed(2) || '0.00',
        'GST (%)': invoice.gst_percentage || 0,
        'GST Amount (₹)': invoice.gst_amount?.toFixed(2) || '0.00',
        'Discount (₹)': invoice.discount?.toFixed(2) || '0.00',
        'Total Amount (₹)': invoice.total_amount?.toFixed(2) || '0.00',
        'Payment Status': invoice.payment_status || 'pending',
        'GST Invoice': invoice.is_gst_invoice ? 'Yes' : 'No',
        'Created At': invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'
    }));

    const date = new Date().toISOString().split('T')[0];
    exportToXLSX(formattedData, `billing_invoices_${date}`, 'Invoices');
};

/**
 * Export invoice items to XLSX
 * @param {Array} items - Array of invoice item objects
 * @param {string} invoiceNumber - Invoice number for the file name
 */
export const exportInvoiceItemsToXLSX = (items, invoiceNumber) => {
    const formattedData = items.map(item => ({
        'Item Name': item.item_name,
        'Item Type': item.item_type,
        'Quantity': item.quantity,
        'Unit Price (₹)': item.unit_price?.toFixed(2) || '0.00',
        'Total Price (₹)': item.total_price?.toFixed(2) || '0.00',
    }));

    exportToXLSX(formattedData, `invoice_${invoiceNumber}_items`, 'Items');
};
