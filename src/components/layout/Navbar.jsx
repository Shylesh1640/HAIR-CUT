import { Menu, Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
    const { userProfile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                        >
                            <Menu className="h-6 w-6 text-gray-600" />
                        </button>

                        {/* Search */}
                        <div className="hidden md:block">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                            <Bell className="h-6 w-6 text-gray-600" />
                            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* User menu */}
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-gray-900">
                                    {userProfile?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                    {userProfile?.role || 'Role'}
                                </p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
