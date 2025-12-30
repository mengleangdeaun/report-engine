import { useState, useEffect, Fragment, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { 
    IconUser, 
    IconMail, 
    IconCamera, 
    IconLoader, 
    IconLock, 
    IconTrash, 
    IconAlertTriangle, 
    IconBrandGoogle,
    IconShield,
    IconEye,
    IconEyeOff,
    IconCheck,
    IconX,
    IconInfoCircle,
    IconKey
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    // User info
    const [isSocialUser, setIsSocialUser] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [joinedDate, setJoinedDate] = useState('');
    
    // Store original values
    const [originalData, setOriginalData] = useState({ name: '', email: '', avatar: '' });
    
    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Delete Account State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeletePassword, setShowDeletePassword] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('User Profile'));
        loadProfile();
    }, []);

    useEffect(() => {
        const changed = 
            name !== originalData.name || 
            email !== originalData.email || 
            avatarFile !== null;
        setHasChanges(changed);
    }, [name, email, avatarFile, originalData]);

    const loadProfile = () => {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : {};

        setName(user.name || '');
        setEmail(user.email || '');
        setAvatar(user.avatar || '');
        setUserRole(user.role || 'User');

        const isSocial = !!user.google_id || user.auth_type === 'google';
        setIsSocialUser(isSocial);

        
        if (user.created_at) {
            const date = new Date(user.created_at);
            setJoinedDate(date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }));
        }

        setOriginalData({
            name: user.name || '',
            email: user.email || '',
            avatar: user.avatar || ''
        });
        setLoading(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { 
                toast.error('Image size must be less than 5MB'); 
                return; 
            }
            setAvatarFile(file);
            setAvatar(URL.createObjectURL(file));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleReset = () => {
        setName(originalData.name);
        setEmail(originalData.email);
        setAvatarFile(null);
        setAvatar(originalData.avatar);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        if (avatarFile) formData.append('avatar', avatarFile);

        try {
            const response = await api.post('/user/profile', formData, { 
                headers: { 'Content-Type': 'multipart/form-data' } 
            });
            const updatedUser = response.data.user;
            
            // Update storage
            const isLocalStorage = !!localStorage.getItem('user');
            const currentUserStr = isLocalStorage ? localStorage.getItem('user') : sessionStorage.getItem('user');
            const currentUser = currentUserStr ? JSON.parse(currentUserStr) : {};
            const mergedUser = { ...currentUser, ...updatedUser };
            
            if (isLocalStorage) localStorage.setItem('user', JSON.stringify(mergedUser));
            else sessionStorage.setItem('user', JSON.stringify(mergedUser));
            
            setAvatar(updatedUser.avatar);
            setAvatarFile(null);
            setOriginalData({ 
                name: updatedUser.name, 
                email: updatedUser.email, 
                avatar: updatedUser.avatar 
            });
            setHasChanges(false);
            toast.success('Profile updated successfully');
            
            // Small delay for better UX
            setTimeout(() => window.location.reload(), 500);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { 
            toast.error("New passwords do not match"); 
            return; 
        }
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        
        setPwdLoading(true);
        try {
            await api.put('/user/password', {
                current_password: isSocialUser ? null : currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword
            });
            toast.success(isSocialUser ? "Password set successfully" : "Password changed successfully");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setPwdLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            await api.post('/user/delete', { 
                password: isSocialUser ? null : deletePassword 
            });
            toast.success("Account deleted successfully");
            localStorage.clear();
            sessionStorage.clear();
            navigate('/auth/boxed-signin');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete account");
        } finally {
            setDeleteLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    const getAvatarSrc = () => {
        if (avatar && avatar.startsWith('blob:')) return avatar;
        if (!avatar) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0D8ABC&color=fff&bold=true&size=128`;
        if (avatar.startsWith('http')) return avatar;
        return `http://localhost:8000/storage/${avatar}`;
    };

    // Skeleton Loading
    if (loading) {
        return (
            <div>
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            <div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-pulse">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex flex-col items-center md:items-start">
                                    <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    </div>
                                    <div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-3"></div>
                                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Section Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i}>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 mt-6"></div>
                        </div>
                    </div>

                    {/* Right Column - User Info */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Danger Zone Skeleton */}
                        <div className="bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20 p-6 animate-pulse">
                            <div className="h-6 bg-red-100 dark:bg-red-500/20 rounded w-32 mb-4"></div>
                            <div className="h-4 bg-red-100 dark:bg-red-500/20 rounded w-48 mb-3"></div>
                            <div className="h-10 bg-red-100 dark:bg-red-500/20 rounded w-32"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* ================= HEADER ================= */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <IconUser size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage your account information and security</p>
                        </div>
                    </div>

                    {/* Social User Badge */}
                    {isSocialUser && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                            <IconBrandGoogle size={18} />
                            Signed in with Google
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ================= LEFT COLUMN ================= */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Information Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center md:items-start">
                                <div className="relative group mb-4">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                                        <img 
                                            src={getAvatarSrc()} 
                                            alt="profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={triggerFileInput}
                                        disabled={updating}
                                        className="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-all shadow-lg transform hover:scale-105"
                                    >
                                        <IconCamera size={20} className="text-white" />
                                    </button>
                                    <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleImageChange}
                                        disabled={updating}
                                    />
                                </div>
                                <button
                                    onClick={triggerFileInput}
                                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                    Change Photo
                                </button>
                            </div>

                            {/* Form Section */}
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-6">
                                    Personal Information
                                </h3>
                                
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    disabled={updating}
                                                    required
                                                />
                                                <IconUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="email" 
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${isSocialUser ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'} border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    disabled={updating || isSocialUser}
                                                    required
                                                />
                                                <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            </div>
                                            {isSocialUser && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                    Email is managed by Google
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="submit"
                                                disabled={updating || !hasChanges}
                                                className={`px-5 py-2.5 font-medium rounded-lg transition-all ${
                                                    hasChanges 
                                                        ? 'bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md' 
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {updating ? (
                                                    <span className="flex items-center gap-2">
                                                        <IconLoader size={18} className="animate-spin" />
                                                        Saving...
                                                    </span>
                                                ) : 'Save Changes'}
                                            </button>
                                            {hasChanges && (
                                                <button
                                                    type="button"
                                                    onClick={handleReset}
                                                    className="px-5 py-2.5 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <IconKey size={20} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Security</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Change your password to keep your account secure
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {/* Current Password - Only for non-social users */}
                                {!isSocialUser && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showCurrentPassword ? "text" : "password"}
                                                className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="Current password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                {showCurrentPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? "text" : "password"}
                                            className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="New password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showNewPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={pwdLoading}
                                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                >
                                    {pwdLoading ? (
                                        <span className="flex items-center gap-2">
                                            <IconLoader size={18} className="animate-spin" />
                                            Updating...
                                        </span>
                                    ) : isSocialUser ? 'Set Password' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ================= RIGHT COLUMN ================= */}
                <div className="space-y-6">
                    {/* User Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <IconInfoCircle size={20} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Account Info</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Your account details
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{userRole}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Account Type</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {isSocialUser ? 'Google Account' : 'Email Account'}
                                </span>
                            </div>
                            {joinedDate && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{joinedDate}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Password Status</span>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    isSocialUser 
                                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                    {isSocialUser ? 'Google Managed' : 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone Card */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-red-500/5 rounded-xl border border-red-200 dark:border-red-500/20 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <IconAlertTriangle size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-700 dark:text-red-400 text-lg">Danger Zone</h3>
                                <p className="text-sm text-red-600/70 dark:text-red-400/70">
                                    Irreversible account actions
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Delete Account</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Once you delete your account, all your data will be permanently removed.
                                    This action cannot be undone.
                                </p>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="w-full py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= DELETE MODAL ================= */}
            <Transition appear show={isDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !deleteLoading && setIsDeleteModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all border border-red-200 dark:border-red-500/20">
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                                <IconTrash className="text-red-600 dark:text-red-400" size={24} />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                                                    Delete Account
                                                </Dialog.Title>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    This action is permanent and cannot be undone.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Password Input - Only for non-social users */}
                                        {!isSocialUser && (
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Confirm your password to continue
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        type={showDeletePassword ? "text" : "password"}
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                                        placeholder="Enter your password"
                                                        value={deletePassword}
                                                        onChange={(e) => setDeletePassword(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        {showDeletePassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3">

<button
    onClick={handleDeleteAccount}
    className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
    // UPDATE THIS LINE:
    disabled={deleteLoading || (!isSocialUser && !deletePassword)}
>
    {deleteLoading ? (
        <span className="flex items-center gap-2">
            <IconLoader size={16} className="animate-spin" />
            Deleting...
        </span>
    ) : 'Delete Account'}
</button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Profile;