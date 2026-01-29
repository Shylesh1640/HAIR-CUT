import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Receipt,
    Users,
    Calendar,
    Scissors,
    Package,
    DollarSign,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    UserCircle,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { userProfile, isAdmin } = useAuth();

    const adminMenuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Billing', icon: Receipt, path: '/billing' },
        { name: 'Customers', icon: UserCircle, path: '/customers' },
        { name: 'Services', icon: Scissors, path: '/services' },
        { name: 'Products', icon: Package, path: '/products' },
        { name: 'Employees', icon: Users, path: '/employees' },
        { name: 'Attendance', icon: Calendar, path: '/attendance' },
        { name: 'Financial', icon: DollarSign, path: '/financial' },
        { name: 'Reports', icon: FileText, path: '/reports' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    const employeeMenuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Billing', icon: Receipt, path: '/billing' },
        { name: 'Customers', icon: UserCircle, path: '/customers' },
        { name: 'Attendance', icon: Calendar, path: '/attendance' },
    ];

    const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-gray-200 ${isOpen ? 'w-64' : 'w-20'
                    } hidden lg:block`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        {isOpen && (
                            <div className="flex items-center space-x-2">
                                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <Scissors className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900">Salon</h1>
                                    <p className="text-xs text-gray-500">Management</p>
                                </div>
                            </div>
                        )}
                        {!isOpen && (
                            <div className="mx-auto h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Scissors className="h-6 w-6 text-primary-600" />
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-3">
                            {menuItems.map((item) => (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            } ${!isOpen && 'justify-center'}`
                                        }
                                        title={!isOpen ? item.name : ''}
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        {isOpen && <span className="font-medium">{item.name}</span>}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Info */}
                    {isOpen && userProfile && (
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <UserCircle className="h-6 w-6 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {userProfile.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{userProfile.role}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-4 border-t border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        {isOpen ? (
                            <ChevronLeft className="h-5 w-5 text-gray-600 mx-auto" />
                        ) : (
                            <ChevronRight className="h-5 w-5 text-gray-600 mx-auto" />
                        )}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 bg-white border-r border-gray-200 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center space-x-2 p-4 border-b border-gray-200">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Scissors className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Salon</h1>
                            <p className="text-xs text-gray-500">Management</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-3">
                            {menuItems.map((item) => (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`
                                        }
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Info */}
                    {userProfile && (
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <UserCircle className="h-6 w-6 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {userProfile.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{userProfile.role}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
