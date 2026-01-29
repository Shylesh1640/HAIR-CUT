import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('AuthContext: Initializing session check...');

        // 1. Check if Supabase client is available
        if (!supabase) {
            console.error('AuthContext: Supabase client is NULL! Check your keys in .env');
            setLoading(false);
            return;
        }

        // 2. Load session from localStorage
        const savedUser = localStorage.getItem('salon_session');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                console.log('AuthContext: Restored session for', parsedUser.email);
                setUser(parsedUser);
                setUserProfile(parsedUser);
            } catch (err) {
                console.error('AuthContext: Failed to parse saved session', err);
                localStorage.removeItem('salon_session');
            }
        }

        setLoading(false);
    }, []);

    const signIn = async (email, password) => {
        try {
            console.log('AuthContext: Attempting login for:', email);
            setLoading(true);

            // Search for user in the public.users table
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase().trim())
                .eq('password', password) // Comparing plain text as per requested local setup
                .single();

            if (error) {
                console.error('AuthContext: Supabase error during sign-in:', error);
                if (error.code === 'PGRST116') {
                    throw new Error('Invalid email or password. Please make sure you have run the SQL schema in Supabase Dashboard.');
                }
                throw new Error(error.message);
            }

            if (!data) {
                console.warn('AuthContext: No user data returned');
                throw new Error('Invalid email or password');
            }

            if (!data.is_active) {
                throw new Error('Account is inactive. Please contact admin.');
            }

            // Success!!
            console.log('AuthContext: Login successful for', data.full_name);
            const userSession = {
                id: data.id,
                email: data.email,
                role: data.role,
                full_name: data.full_name
            };

            setUser(userSession);
            setUserProfile(data);
            localStorage.setItem('salon_session', JSON.stringify(userSession));

            toast.success('Logged in successfully!');
            return { data, error: null };
        } catch (error) {
            console.error('AuthContext: Sign in exception:', error.message);
            toast.error(error.message || 'Failed to sign in');
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, fullName, role = 'employee') => {
        try {
            setLoading(true);
            console.log('AuthContext: Registering new user:', email);

            // Create user profile directly in the public.users table
            const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        email: email.toLowerCase().trim(),
                        password,
                        full_name: fullName,
                        role,
                        is_active: true,
                    },
                ])
                .select()
                .single();

            if (error) {
                console.error('AuthContext: Supabase error during sign-up:', error);
                throw error;
            }

            toast.success('Account created! You can now log in.');
            return { data, error: null };
        } catch (error) {
            console.error('AuthContext: Sign up exception:', error.message);
            toast.error(error.message || 'Failed to create account');
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        console.log('AuthContext: Signing out...');
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('salon_session');
        toast.success('Logged out successfully!');
    };

    const value = {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin: userProfile?.role === 'admin',
        isEmployee: userProfile?.role === 'employee',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
