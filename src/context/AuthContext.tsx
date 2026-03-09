'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    username: string;
    profilePicture?: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, username: string, pass: string) => Promise<void>;
    logout: () => void;
    updateUser: (data: { username?: string; password?: string; profilePicture?: string | null }) => Promise<void>;
    isLoading: boolean;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Init auth from local storage
        const storedToken = localStorage.getItem('flixview_token');
        const storedUser = localStorage.getItem('flixview_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);

        // Listen for 401 Unauthorized events
        const handleUnauthorized = () => {
            setToken(null);
            setUser(null);
            localStorage.removeItem('flixview_token');
            localStorage.removeItem('flixview_user');
            router.push('/');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const login = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            const res = await api.auth.login(email, pass);
            setToken(res.token);
            setUser(res.user);
            localStorage.setItem('flixview_token', res.token);
            localStorage.setItem('flixview_user', JSON.stringify(res.user));

            // Trigger sync
            try {
                const syncData = await api.sync.getData(res.token);
                // TODO: Merge cloud data with local storage?
                // For now, let's just log it. We need a strategy to merge.
                console.log('Cloud Data:', syncData);
            } catch (e) {
                console.error('Sync failed on login', e);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, username: string, pass: string) => {
        setIsLoading(true);
        try {
            const res = await api.auth.register(email, username, pass);
            // Auto login after register? Or just redirect?
            // Let's login
            await login(email, pass);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('flixview_token');
        localStorage.removeItem('flixview_user');
        router.push('/');
    };

    const updateUser = async (data: { username?: string; password?: string; profilePicture?: string | null }) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await api.auth.updateProfile(token, data);
            setUser(res.user);
            localStorage.setItem('flixview_user', JSON.stringify(res.user));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, register, logout, isLoading, updateUser,
            isAuthModalOpen, openAuthModal: () => setIsAuthModalOpen(true), closeAuthModal: () => setIsAuthModalOpen(false)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
