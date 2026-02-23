import { useState, useEffect, Fragment, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
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
import { useNavigate, Link } from 'react-router-dom';

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
            if (response.data.user) {
                // Assuming updateUser is an action creator from Redux store
                // dispatch(updateUser(response.data.user)); 
                // Update local storage immediately to reflect changes
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUserInStorage = { ...storedUser, ...response.data.user };
                localStorage.setItem('user', JSON.stringify(updatedUserInStorage));

                // Show specific message if email was changed
                if (response.data.email_changed) {
                    toast.success('Profile updated. Please check your inbox to verify your new email.', {
                        duration: 6000,
                        icon: '📧'
                    });
                } else {
                    toast.success('Profile updated successfully');
                }
            }
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
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center md:items-start opacity-100">
                                    <div className="relative group mb-4">
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                                            <img
                                                src={getAvatarSrc()}
                                                alt="profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <Button
                                            size="icon"
                                            onClick={triggerFileInput}
                                            disabled={updating}
                                            className="absolute bottom-2 right-2 rounded-full shadow-lg transform hover:scale-105"
                                        >
                                            <IconCamera size={20} className="text-white" />
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            disabled={updating}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"

                                        onClick={triggerFileInput}
                                        className="text-primary hover:text-primary/80"
                                    >
                                        Change Photo
                                    </Button>
                                </div>

                                {/* Form Section */}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-6">
                                        Personal Information
                                    </h3>

                                    <form onSubmit={handleSubmit}>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="fullName" className="mb-2 block">
                                                    Full Name
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="fullName"
                                                        type="text"
                                                        className="pl-10"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        disabled={updating}
                                                        required
                                                    />
                                                    <IconUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                </div>
                                            </div>

                                            <div>
                                                <Label htmlFor="email" className="mb-2 block">
                                                    Email Address
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        className={`pl-10 ${isSocialUser ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        disabled={updating || isSocialUser}
                                                        required
                                                    />
                                                    <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                </div>
                                                {isSocialUser && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Email is managed by Google
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    type="submit"
                                                    disabled={updating || !hasChanges}
                                                    className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
                                                >
                                                    {updating ? (
                                                        <>
                                                            <IconLoader size={18} className="animate-spin mr-2" />
                                                            Saving...
                                                        </>
                                                    ) : 'Save Changes'}
                                                </Button>
                                                {hasChanges && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={handleReset}
                                                    >
                                                        Reset
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <IconKey size={20} className="text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Security</CardTitle>
                                    <CardDescription>
                                        Change your password to keep your account secure
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {/* Current Password - Only for non-social users */}
                                    {!isSocialUser && (
                                        <div>
                                            <Label htmlFor="currentPassword" className="mb-2 block">
                                                Current Password
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="currentPassword"
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    className="pr-10"
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
                                        <Label htmlFor="newPassword" className="mb-2 block">
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                className="pr-10"
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
                                        <Label htmlFor="confirmPassword" className="mb-2 block">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="pr-10"
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
                                    <Button
                                        type="submit"
                                        disabled={pwdLoading}
                                    >
                                        {pwdLoading ? (
                                            <>
                                                <IconLoader size={18} className="animate-spin mr-2" />
                                                Updating...
                                            </>
                                        ) : isSocialUser ? 'Set Password' : 'Change Password'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* ================= RIGHT COLUMN ================= */}
                <div className="space-y-6">
                    {/* User Info Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <IconInfoCircle size={20} className="text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Account Info</CardTitle>
                                    <CardDescription>
                                        Your account details
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <Badge
                                    variant="secondary"
                                    className={`${isSocialUser
                                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                        }`}
                                >
                                    {isSocialUser ? 'Google Managed' : 'Active'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone Card */}
                    <Card className="border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <IconAlertTriangle size={20} className="text-red-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-red-700 dark:text-red-400">Danger Zone</CardTitle>
                                    <CardDescription className="text-red-600/70 dark:text-red-400/70">
                                        Irreversible account actions
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Delete Account</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Once you delete your account, all your data will be permanently removed.
                                    This action cannot be undone.
                                </p>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ================= DELETE MODAL ================= */}
            <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !deleteLoading && setIsDeleteModalOpen(open)}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <IconTrash className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <div>
                                <DialogTitle>Delete Account</DialogTitle>
                                <DialogDescription>
                                    This action is permanent and cannot be undone.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-4">
                        {/* Password Input - Only for non-social users */}
                        {!isSocialUser && (
                            <div className="mb-4">
                                <Label htmlFor="deletePassword" className="mb-2 block">
                                    Confirm your password to continue
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="deletePassword"
                                        type={showDeletePassword ? "text" : "password"}
                                        className="pr-10 focus-visible:ring-red-500"
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
                                <div className="mt-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/auth/boxed-password-reset')}
                                        className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors bg-transparent border-none p-0 cursor-pointer"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleteLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteLoading || (!isSocialUser && !deletePassword)}
                        >
                            {deleteLoading ? (
                                <>
                                    <IconLoader size={16} className="animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : 'Delete Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profile;