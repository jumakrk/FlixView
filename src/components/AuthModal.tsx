'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, Loader2, AlertCircle, Play, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { login, register } = useAuth();

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setError(null);
            setEmail('');
            setPassword('');
            setUsername('');
            setIsLogin(true);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            setShowPassword(false);
        };
    }, [isOpen]);

    const calculatePasswordStrength = (pass: string) => {
        return [
            { label: "At least 8 characters", met: pass.length >= 8 },
            { label: "Uppercase & lowercase letters", met: /[a-z]/.test(pass) && /[A-Z]/.test(pass) },
            { label: "At least one number", met: /\d/.test(pass) },
            { label: "At least one symbol", met: /[^A-Za-z0-9]/.test(pass) },
        ];
    };

    const requirements = calculatePasswordStrength(password);
    const allRequirementsMet = requirements.every(r => r.met);

    const getFriendlyErrorMessage = (error: any) => {
        const message = error.message || 'Something went wrong';

        // Strip status code if present (e.g., "409: Email already exists")
        const cleanMessage = message.replace(/^\d+:\s*/, '');

        if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('network error')) {
            return "Unable to connect. Please check your internet connection.";
        }

        // Map backend errors to friendly messages
        if (cleanMessage.includes('User already exists') || cleanMessage.includes('already registered')) {
            return "This email is already associated with an account.";
        }
        if (cleanMessage.includes('Invalid credentials') || cleanMessage.includes('Unauthorized') || cleanMessage.includes('Login failed')) {
            return "Incorrect email or password. Please try again.";
        }
        if (cleanMessage.includes('User not found')) {
            return "No account found with this email address.";
        }
        if (cleanMessage.includes('Username taken')) {
            return "This username is already taken. Please choose another.";
        }

        return cleanMessage;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isLogin && !allRequirementsMet) {
            setError("Please satisfy all password requirements");
            return;
        }

        setIsLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (username.length < 3) {
                    throw new Error('Username must be at least 3 characters');
                }
                await register(email, username, password);
            }
            onClose();
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[400px] bg-[#0f1115] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1"
                >
                    <X size={20} />
                </button>

                {/* Top Section: Logo & Tabs */}
                <div className="pt-8 px-6 pb-0">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white">
                            <Play size={16} fill="currentColor" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-wide">FLIXVIEW</span>
                    </div>

                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            Login
                            {isLogin && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />
                            )}
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${!isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            Sign Up
                            {!isLogin && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-6 pt-6 flex-1 flex flex-col">
                    <p className="text-center text-gray-400 text-sm mb-6">
                        {isLogin
                            ? "Welcome back! Login to continue watching."
                            : "Create an account to save movies and shows."}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#15181e] border border-white/5 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-[#1a1d24] transition-all"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#15181e] border border-white/5 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-[#1a1d24] transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#15181e] border border-white/5 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-[#1a1d24] transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password Strength Checklist - Sign Up Only */}
                            {!isLogin && password.length > 0 && (
                                <div className="space-y-1 pl-1">
                                    {requirements.map((req, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                            {req.met ? (
                                                <Check size={12} className="text-green-500" />
                                            ) : (
                                                <X size={12} className="text-gray-600" />
                                            )}
                                            <span className={req.met ? "text-gray-300" : "text-gray-500"}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-violet-900/20 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                isLogin ? 'Login' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                        >
                            Continue streaming as a guest
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
