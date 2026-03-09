'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { User, LogOut, Check, X, Shield, Bookmark, Heart, Grid, Camera, Lock, Mail, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
    const { user, logout, updateUser } = useAuth();
    const { watchlist, favorites } = useData();

    // -- Local State --
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(user?.profilePicture || null);

    // Visibility State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Status Feedback
    const [picStatus, setPicStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [userStatus, setUserStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Loading States
    const [isPicLoading, setIsPicLoading] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(false);
    const [isPassLoading, setIsPassLoading] = useState(false);

    // Sync state with user context updates
    useEffect(() => {
        if (user) {
            if (!userStatus) setUsername(user.username);
            if (!picStatus) setProfilePic(user.profilePicture || null);
        }
    }, [user]);

    // Auto-dismiss status messages
    useEffect(() => {
        if (picStatus) { const t = setTimeout(() => setPicStatus(null), 3000); return () => clearTimeout(t); }
    }, [picStatus]);
    useEffect(() => {
        if (userStatus) { const t = setTimeout(() => setUserStatus(null), 3000); return () => clearTimeout(t); }
    }, [userStatus]);
    useEffect(() => {
        if (passStatus) { const t = setTimeout(() => setPassStatus(null), 3000); return () => clearTimeout(t); }
    }, [passStatus]);

    // -- Helpers --

    const isUsernameChanged = user && username !== user.username && username.trim().length >= 3;
    const isPicChanged = user && profilePic !== (user.profilePicture || null);

    const passwordRequirements = [
        { label: 'At least 8 characters', valid: password.length >= 8 },
        { label: 'Uppercase & lowercase', valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
        { label: 'At least one number', valid: /\d/.test(password) },
    ];
    // Must match requirements AND confirm password must match
    const isPasswordValid = passwordRequirements.every(r => r.valid) && password === confirmPassword;

    // -- Handlers --

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            setPicStatus({ type: 'error', message: 'Image too large (Max 20MB)' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setProfilePic(dataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSavePic = async () => {
        if (!profilePic) return;
        setIsPicLoading(true);
        try {
            await updateUser({ profilePicture: profilePic });
            setPicStatus({ type: 'success', message: 'Picture updated' });
        } catch (err: any) {
            setPicStatus({ type: 'error', message: err.message || 'Failed' });
        } finally {
            setIsPicLoading(false);
        }
    };

    const handleSaveUsername = async () => {
        if (!isUsernameChanged) return;
        setIsUserLoading(true);
        try {
            await updateUser({ username });
            setUserStatus({ type: 'success', message: 'Username updated' });
        } catch (err: any) {
            setUserStatus({ type: 'error', message: err.message || 'Failed' });
        } finally {
            setIsUserLoading(false);
        }
    };

    const handleSavePassword = async () => {
        if (!isPasswordValid) return;
        setIsPassLoading(true);
        try {
            await updateUser({ password });
            setPassStatus({ type: 'success', message: 'Password updated' });
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPassStatus({ type: 'error', message: err.message || 'Failed' });
        } finally {
            setIsPassLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <Shield size={64} className="text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Guest Mode</h2>
                <p className="text-gray-400 max-w-md"> Please log in to view your profile and manage your account settings.</p>
            </div>
        );
    }

    // Stats Array
    const stats = [
        { label: 'Watchlist', value: watchlist.length, icon: Bookmark, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Favorites', value: favorites.length, icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10' },
    ];

    return (
        <div className="container max-w-5xl mx-auto px-6 pb-20 fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 py-8 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                    <p className="text-gray-400">Manage your account settings and preferences.</p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-medium"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Stats */}
                <div className="space-y-6">
                    {/* AVATAR SECTION */}
                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 flex flex-col items-center">
                        <div className="relative group mb-6">
                            <div className="w-40 h-40 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center text-6xl font-bold text-white shadow-2xl shadow-violet-900/40 border-4 border-[#0a0a0f]">
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-6xl font-bold text-white">
                                        {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Hover Overlay */}
                            <label className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 backdrop-blur-[2px]">
                                <Camera size={32} className="text-white mb-2" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Change Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>

                        {/* Save Button for Picture (Always visible, disabled if no change) */}
                        <button
                            onClick={handleSavePic}
                            disabled={!isPicChanged || isPicLoading}
                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 mb-4 transition-all"
                        >
                            {isPicLoading && <Loader2 className="animate-spin" size={16} />}
                            Save
                        </button>

                        {/* Picture Status Feedback */}
                        <AnimatePresence>
                            {picStatus && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`w-full py-2 px-3 rounded-lg text-xs text-center border ${picStatus.type === 'success'
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}
                                >
                                    {picStatus.message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="w-full h-px bg-white/5 my-6" />

                        <div className="w-full text-center">
                            <h3 className="font-bold text-white text-xl mb-1">{user.username}</h3>
                            <p className="text-gray-500 text-sm mb-6">{user.email}</p>

                            <div className="grid grid-cols-2 gap-3 text-left">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="bg-[#12141a] p-3 rounded-xl border border-white/5">
                                        <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                                            <stat.icon size={16} />
                                        </div>
                                        <div className="text-xl font-bold text-white">{stat.value}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="lg:col-span-2 space-y-6">

                    {/* USERNAME SECTION */}
                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                                <User size={20} className="text-violet-400" />
                                Username
                            </h3>
                            <AnimatePresence>
                                {userStatus && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`text-xs px-2 py-1 rounded border ${userStatus.type === 'success' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'
                                            }`}
                                    >
                                        {userStatus.message}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#12141a] border border-white/10 focus:border-violet-500/50 rounded-xl py-3 px-4 text-white focus:outline-none transition-all pl-10"
                                    placeholder="Username"
                                />
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            </div>
                            <button
                                onClick={handleSaveUsername}
                                disabled={!isUsernameChanged || isUserLoading}
                                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-6 rounded-xl transition-all shadow-lg shadow-violet-900/20"
                            >
                                {isUserLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-1">Must be unique and at least 3 characters.</p>
                    </div>

                    {/* PASSWORD SECTION */}
                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                                <Lock size={20} className="text-violet-400" />
                                Change Password
                            </h3>
                            <AnimatePresence>
                                {passStatus && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`text-xs px-2 py-1 rounded border ${passStatus.type === 'success' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'
                                            }`}
                                    >
                                        {passStatus.message}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-4">
                            {/* New Password Input */}
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#12141a] border border-white/10 focus:border-violet-500/50 rounded-xl py-3 px-4 text-white focus:outline-none transition-all pl-10 pr-10"
                                    placeholder="New Password"
                                />
                                <Lock size={18} className="absolute left-3 top-3.5 text-gray-500" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#12141a] border border-white/10 focus:border-violet-500/50 rounded-xl py-3 px-4 text-white focus:outline-none transition-all pl-10 pr-10"
                                    placeholder="Confirm Password"
                                />
                                <Lock size={18} className="absolute left-3 top-3.5 text-gray-500" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Requirements List */}
                            {password.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md pt-2">
                                    {passwordRequirements.map((req, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs">
                                            {req.valid ? (
                                                <Check size={12} className="text-green-500" />
                                            ) : (
                                                <div className="w-3 h-3 rounded-full border border-gray-600" />
                                            )}
                                            <span className={req.valid ? "text-gray-400" : "text-gray-600"}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                    {/* Match Check */}
                                    <div className="flex items-center gap-1.5 text-xs">
                                        {password === confirmPassword && confirmPassword.length > 0 ? (
                                            <Check size={12} className="text-green-500" />
                                        ) : (
                                            <div className="w-3 h-3 rounded-full border border-gray-600" />
                                        )}
                                        <span className={password === confirmPassword && confirmPassword.length > 0 ? "text-gray-400" : "text-gray-600"}>
                                            Passwords match
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSavePassword}
                                    disabled={!isPasswordValid || isPassLoading}
                                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/20"
                                >
                                    {isPassLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    </div>



                </div>
            </div>
        </div>
    );
}
