import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Save, Store, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        business_name: '',
        address: '',
        phone: '',
        email: '',
        gst_number: '',
        default_gst_percentage: 18,
        logo_url: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('business_settings')
                .select('*')
                .limit(1)
                .maybeSingle(); // Use maybeSingle instead of single to avoid error on no rows

            // Handle case where table doesn't exist
            if (error && error.code === '42P01') {
                console.log('business_settings table does not exist - please run schema.sql');
                toast.error('Settings table not found. Please run schema.sql in Supabase.');
                setLoading(false);
                return;
            }

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setSettings({
                    business_name: data.business_name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    gst_number: data.gst_number || '',
                    default_gst_percentage: data.default_gst_percentage || 18,
                    logo_url: data.logo_url || ''
                });
            }
            // If no data, use defaults (first time setup)
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Check if a row exists (we can check if we have an id)
            // Since we don't know the ID if we started empty, we can try Upsert 
            // but standard upsert needs a constraint.
            // Usually business_settings is a single row table.
            // Let's assume we maintain ID=1 or something, or we just select first.

            // Better strategy: select to see if exists, then update or insert.
            const { data: existingData } = await supabase
                .from('business_settings')
                .select('id')
                .limit(1)
                .single();

            let result;

            if (existingData) {
                result = await supabase
                    .from('business_settings')
                    .update({
                        ...settings,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingData.id);
            } else {
                result = await supabase
                    .from('business_settings')
                    .insert([{
                        ...settings,
                        // Let Supabase generate ID
                    }]);
            }

            if (result.error) throw result.error;

            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage business profile and invoice configuration</p>
            </div>

            <form onSubmit={handleSave} className="card space-y-6">
                <div className="flex items-center space-x-2 border-b border-gray-200 pb-4">
                    <Store className="h-6 w-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Business Profile</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Name
                        </label>
                        <input
                            type="text"
                            name="business_name"
                            value={settings.business_name}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="e.g. Luxury Salon & Spa"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={settings.phone}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Contact Number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={settings.email}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Business Email"
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={settings.address}
                            onChange={handleChange}
                            className="input-field min-h-[80px]"
                            placeholder="Full Business Address"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Tax & Invoice Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GST Number
                            </label>
                            <input
                                type="text"
                                name="gst_number"
                                value={settings.gst_number}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Regular GSTIN"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default GST %
                            </label>
                            <input
                                type="number"
                                name="default_gst_percentage"
                                value={settings.default_gst_percentage}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="18"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logo URL (Optional)
                            </label>
                            <input
                                type="text"
                                name="logo_url"
                                value={settings.logo_url}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="https://test.com/logo.png"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter a direct link to your logo image. This will appear on invoices.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 px-8"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
