import { useEffect, useState, Fragment, useMemo } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { 
    IconPlus, IconTrash, IconEdit, IconCheck, IconX, 
    IconCurrencyDollar, IconUsers, IconCoin, IconBuilding,
    IconShield, IconSearch, IconFilter, IconInfoCircle,
    IconRefresh, IconAlertCircle, IconChevronDown, IconSettings,
    IconChartBar, IconTicket, IconKey, IconCrown,IconPhoto, IconZoomIn, IconZoomOut
} from '@tabler/icons-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import PerfectScrollbar from 'react-perfect-scrollbar';

const PlanSettings = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal State
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<any>(null);

    const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>('details');


    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [availableColors, setAvailableColors] = useState<any[]>([]);

// Helper function to get selected color background
const getSelectedColorBackground = (opacity: number = 1) => {
    if (!currentPlan.color_id) return `rgba(67, 97, 238, ${opacity})`; // Default primary color
    
    const selectedColor = availableColors.find(c => c.id === currentPlan.color_id);
    if (!selectedColor) return `rgba(67, 97, 238, ${opacity})`;
    
    if (selectedColor.is_gradient) {
        return `linear-gradient(135deg, ${hexToRgba(selectedColor.hex_start, opacity)}, ${hexToRgba(selectedColor.hex_end, opacity)})`;
    }
    
    return hexToRgba(selectedColor.hex_code, opacity);
};

// Helper function to get text color based on background
const getSelectedColorText = () => {
    if (!currentPlan.color_id) return '#4361ee';
    return '#ffffff'; // For simplicity, or implement color contrast detection
};

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Fetch available colors on component mount
useEffect(() => {
    const fetchColors = async () => {
        try {
            const res = await api.get('/admin/colors');
            setAvailableColors(res.data);
        } catch (error) {
            console.error('Failed to load colors');
        }
    };
    fetchColors();
}, []);

    const fetchPlans = async () => {
        try {
            const [plansRes, featuresRes] = await Promise.all([
                api.get('/plans'),
                api.get('/admin/permissions/available')
            ]);
            
            setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
            setAvailableFeatures(Array.isArray(featuresRes.data) ? featuresRes.data : []); 
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to load configuration');
            setAvailableFeatures([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchColors = async () => {
    const res = await api.get('/admin/colors'); // Your new color management API
    setAvailableColors(res.data);
};


    useEffect(() => {
        fetchPlans();
        fetchColors();
    }, []);

    // Default Empty State for Creating
const defaultPlan = {
    id: null,
    name: '',
    slug: '',
    price: 0,
    member_limit: 1,
    max_workspaces: 1,
    max_tokens: 0,
    features: [],
    is_active: true,
    description: '',
    badge_label: '',
    is_popular: false,
    color_id: 1, // Default color ID
    icon_svg: '' // Store raw SVG string
};
    
    const groupedFeatures = useMemo(() => {
        if (!Array.isArray(availableFeatures)) return {};
        return availableFeatures.reduce((acc: any, feature: any) => {
            const moduleName = feature.module || 'General';
            if (!acc[moduleName]) acc[moduleName] = [];
            acc[moduleName].push(feature);
            return acc;
        }, {});
    }, [availableFeatures]);

    const [currentPlan, setCurrentPlan] = useState<any>(defaultPlan);
    const [initialPlan, setInitialPlan] = useState<any>(defaultPlan);

    // Check if form has changes
    const hasChanges = useMemo(() => {
        return JSON.stringify(currentPlan) !== JSON.stringify(initialPlan);
    }, [currentPlan, initialPlan]);

    const toggleFeature = (featureName: string) => {
        let newFeatures = [...(currentPlan.features || [])];
        if (newFeatures.includes(featureName)) {
            newFeatures = newFeatures.filter(f => f !== featureName);
        } else {
            newFeatures.push(featureName);
        }
        handleChange('features', newFeatures);
    };

    // Open Modal for CREATE
const openCreate = () => {
    const freshPlan = { 
        ...defaultPlan, 
        features: [],
        color_id: 1, // Ensure default color is set
        icon_svg: '', 
        // ... rest of your reset logic
    };
    setCurrentPlan(freshPlan);
    setInitialPlan(freshPlan);
    setIsOpen(true);
};

    // Open Modal for EDIT
    const openEdit = (plan: any) => {
        let features = plan.features;
        if (typeof features === 'string') {
            try {
                features = JSON.parse(features);
            } catch (e) {
                features = [];
            }
        }
        if (!Array.isArray(features)) {
            features = [];
        }
        const planCopy = { 
            ...plan,
            features: features 
        };
        setCurrentPlan(planCopy);
        setInitialPlan(planCopy);
        setIsOpen(true);
    };

    // Open Delete Confirmation
    const openDeleteModal = (plan: any) => {
        setPlanToDelete(plan);
        setIsDeleteModalOpen(true);
    };

    // Handle Delete
    const handleDelete = async () => {
        if (!planToDelete) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/admin/plans/${planToDelete.id}`);
            toast.success('Plan deleted successfully');
            setPlans(plans.filter(p => p.id !== planToDelete.id));
            setIsDeleteModalOpen(false);
            setPlanToDelete(null);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to delete plan');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Submit (Create OR Update)
    const handleSave = async () => {
        if (!currentPlan.name || !currentPlan.slug) {
            toast.error("Name and Slug are required");
            return;
        }


        
        setIsSubmitting(true);
        try {
            if (currentPlan.id) {
                await api.put(`/admin/plans/${currentPlan.id}`, currentPlan);
                toast.success('Plan updated successfully');
                setPlans(plans.map(p => p.id === currentPlan.id ? currentPlan : p));
            } else {
                const res = await api.post('/admin/plans', currentPlan);
                toast.success('Plan created successfully');
                setPlans([...plans, res.data]);
            }
            setIsOpen(false);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

const handleChange = (field: string, value: any) => {
    setCurrentPlan(prev => ({ 
        ...prev, 
        [field]: value 
    }));
};

    // Auto-generate slug from name
    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

const handleNameChange = (name: string) => {
    const slug = !currentPlan.id ? generateSlug(name) : currentPlan.slug;
    
    // Update both fields at once
    setCurrentPlan({ 
        ...currentPlan, 
        name: name, 
        slug: slug 
    });
};

    // Loading skeleton
    if (loading) {
        return (
            <div>
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        <div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 mb-6 animate-pulse">
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    </div>
                </div>

                {/* Plan Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                            <div className="flex justify-between mb-6">
                                <div>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                </div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            </div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6"></div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    ))}
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
                            <IconCurrencyDollar size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                                Configure subscription plans and pricing tiers
                            </p>
                        </div>
                    </div>
                    
                    {/* Stats Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-500/10 dark:to-emerald-500/5 text-emerald-700 dark:text-emerald-400 rounded-full font-medium border border-emerald-200 dark:border-emerald-500/20">
                        <IconCurrencyDollar size={16} />
                        <span className="font-bold">{plans.length}</span> Active Plans
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20 dark:border-primary/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle className="text-primary shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-primary dark:text-primary-light mb-1">Plan Configuration</h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                Create and manage subscription plans. Each plan determines available features, member limits, and token allowances for teams.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= PLANS GRID ================= */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Plans</h2>
                    <button 
                        onClick={openCreate} 
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                    >
                        <IconPlus size={18} />
                        Add New Plan
                    </button>
                </div>

                {plans.length === 0 ? (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6">
                            <IconCurrencyDollar size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">No Plans Created Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                            Start by creating your first subscription plan to offer teams access to your platform.
                        </p>
                        <button 
                            onClick={openCreate} 
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                        >
                            <IconPlus size={18} />
                            Create First Plan
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div 
                                key={plan.id} 
                                className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                                    !plan.is_active 
                                        ? 'opacity-60 border-gray-300 dark:border-gray-600' 
                                        : plan.is_popular
                                        ? 'border-primary/50 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                }`}
                            >
                                {/* Popular Badge */}
                                {plan.is_popular === 1 && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white text-xs font-bold shadow-md">
                                            <IconCrown size={12} />
                                            MOST POPULAR
                                        </span>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                    {plan.is_active ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                            <IconCheck size={12} /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                                            <IconX size={12} /> Inactive
                                        </span>
                                    )}
                                </div>

                                <div className="p-6">
                                    {/* Plan Header */}
                                    <div className="mb-6">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                                                {plan.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            {plan.slug}
                                        </code>
                                    </div>
                                    
                                    {/* Price Display */}
                                    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                                ${plan.price}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                                        </div>
                                        {plan.badge_label && (
                                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                                                {plan.badge_label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Features List */}
                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                                <IconUsers size={18} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Team Members</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {plan.member_limit} {plan.member_limit === 1 ? 'user' : 'users'} max
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                                <IconCoin size={18} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Tokens</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {plan.max_tokens?.toLocaleString() || '∞'} tokens
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                                <IconBuilding size={18} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Workspaces</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {plan.max_workspaces?.toLocaleString() || 1} workspace{plan.max_workspaces !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openEdit(plan)}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg border border-primary/20 transition-colors"
                                        >
                                            <IconEdit size={16} />
                                            Edit Plan
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(plan)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/30 transition-colors"
                                        >
                                            <IconTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ================= CREATE / EDIT MODAL ================= */}
<Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsOpen(false)}>
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
                    <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                        {/* Fixed Header */}
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
                                        <IconCurrencyDollar size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                            {currentPlan.id ? 'Edit Plan' : 'Create New Plan'}
                                        </Dialog.Title>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            Configure subscription plan details and features
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Close Button */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    disabled={isSubmitting}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <IconX size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                            <nav className="flex space-x-6" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                                        activeTab === 'details'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <IconSettings size={16} />
                                        Plan Details
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('features')}
                                    className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                                        activeTab === 'features'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <IconShield size={16} />
                                        Included Features
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('appearance')}
                                    className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                                        activeTab === 'appearance'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <IconPhoto size={16} />
                                        Appearance
                                    </div>
                                </button>
                            </nav>
                        </div>

                        {/* Scrollable Content */}
                        <div className="max-h-[70vh] overflow-y-auto">
                            <div className="p-6">
                                {/* Tab 1: Plan Details */}
                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        {/* Basic Information */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                Basic Information
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Plan Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        value={currentPlan.name}
                                                        onChange={(e) => handleNameChange(e.target.value)}
                                                        placeholder="e.g., Professional"
                                                        disabled={isSubmitting}
                                                        autoFocus
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Plan Slug <span className="text-red-500">*</span>
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                                                            currentPlan.id ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                                                        }`}
                                                        value={currentPlan.slug}
                                                        onChange={(e) => handleChange('slug', e.target.value)}
                                                        placeholder="e.g., professional"
                                                        readOnly={!!currentPlan.id}
                                                        disabled={isSubmitting}
                                                    />
                                                    {!currentPlan.id && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                            Auto-generated from plan name
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Description
                                                </label>
                                                <textarea 
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    value={currentPlan.description || ''}
                                                    onChange={(e) => handleChange('description', e.target.value)}
                                                    placeholder="Brief description of this plan"
                                                    rows={2}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>

                                        {/* Pricing & Status */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                Pricing & Status
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Monthly Price
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-full pl-8 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                            value={currentPlan.price}
                                                            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                                                            min="0"
                                                            step="0.01"
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Status
                                                    </label>
                                                    <select 
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        value={currentPlan.is_active ? '1' : '0'}
                                                        onChange={(e) => handleChange('is_active', e.target.value === '1')}
                                                        disabled={isSubmitting}
                                                    >
                                                        <option value="1">Active</option>
                                                        <option value="0">Inactive</option>
                                                    </select>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Badge Label
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        value={currentPlan.badge_label || ''}
                                                        onChange={(e) => handleChange('badge_label', e.target.value)}
                                                        placeholder="e.g., Best Value"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Limits & Quotas */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                Limits & Quotas
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Member Limit
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        value={currentPlan.member_limit}
                                                        onChange={(e) => handleChange('member_limit', parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        disabled={isSubmitting}
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        Maximum team members
                                                    </p>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Workspace Limit
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        value={currentPlan.max_workspaces}
                                                        onChange={(e) => handleChange('max_workspaces', parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        disabled={isSubmitting}
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        Maximum workspaces
                                                    </p>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Token Limit
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        value={currentPlan.max_tokens}
                                                        onChange={(e) => handleChange('max_tokens', parseInt(e.target.value) || 0)}
                                                        min="0"
                                                        step="1000"
                                                        disabled={isSubmitting}
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        Monthly token allowance
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Popular Plan Toggle */}
                                        <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                                        Mark as Most Popular
                                                    </h4>
                                                    <p className="text-sm text-amber-700 dark:text-amber-400/70">
                                                        Highlight this plan as the recommended choice
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer"
                                                        checked={currentPlan.is_popular}
                                                        onChange={(e) => handleChange('is_popular', e.target.checked)}
                                                        disabled={isSubmitting}
                                                    />
                                                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 2: Features */}
                                {activeTab === 'features' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                    Included Features
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Select the features available in this plan
                                                </p>
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {currentPlan.features?.length || 0} selected
                                            </div>
                                        </div>

                                        <PerfectScrollbar className="h-[400px] pr-2">
                                            <div className="space-y-6">
                                                {Object.entries(groupedFeatures).map(([moduleName, features]: [string, any]) => (
                                                    <div key={moduleName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                                {moduleName}
                                                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                                                                    ({features.length})
                                                                </span>
                                                            </h4>
                                                        </div>
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {features.map((feature: any) => (
                                                                <label 
                                                                    key={feature.id} 
                                                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                                        currentPlan.features?.includes(feature.name) 
                                                                            ? 'border-primary bg-primary/5' 
                                                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center h-5">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                                                                            checked={currentPlan.features?.includes(feature.name)}
                                                                            onChange={() => toggleFeature(feature.name)}
                                                                            disabled={isSubmitting}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                <span className="font-medium text-gray-900 dark:text-white block">
                                                                                    {feature.label || feature.name.replace(/_/g, ' ')}
                                                                                </span>
                                                                                {feature.description && (
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                                                        {feature.description}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            {currentPlan.features?.includes(feature.name) && (
                                                                                <IconCheck size={16} className="text-primary shrink-0 ml-2" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </PerfectScrollbar>
                                        
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-lg border border-blue-200 dark:border-blue-500/20">
                                            <div className="flex items-start gap-3">
                                                <IconInfoCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-blue-700 dark:text-blue-400">
                                                        Selected features determine which permissions are available to teams on this plan. 
                                                        Features can be customized per team in the team management section.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 3: Appearance */}
{/* Tab 3: Appearance */}
{activeTab === 'appearance' && (
    <div className="space-y-6">
        <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                Visual Customization
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Customize how this plan appears in the interface
            </p>
        </div>

        {/* Icon Section */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                    Plan Icon
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Optional
                </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SVG Code Input with PerfectScrollbar */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SVG Code
                    </label>
                    <div className="relative h-[200px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                        <PerfectScrollbar>
                            <textarea 
                                className="w-full outline-none px-4 py-3 bg-transparent border-0 focus:ring-0 font-mono text-sm resize-none min-h-[200px] text-gray-900 dark:text-gray-100"
                                rows={8}
                                placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="..."/></svg>'
                                value={currentPlan.icon_svg || ''}
                                onChange={(e) => handleChange('icon_svg', e.target.value)}
                                disabled={isSubmitting}
                            />
                        </PerfectScrollbar>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Paste raw SVG code. Recommended size: 24x24 or 32x32.
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                                {currentPlan.icon_svg ? `${currentPlan.icon_svg.length} characters` : 'Empty'}
                            </span>
                        </div>
                    </div>
                </div>
                
{/* Enhanced Live Preview */}
<div className="h-full flex flex-col">
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Live Preview
        </label>
        
        {/* Enhanced Zoom Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Zoom Percentage Display */}
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                        {Math.round(zoomLevel * 100)}%
                    </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div>Original: 64×64px</div>
                    <div>Current: {Math.round(64 * zoomLevel)}×{Math.round(64 * zoomLevel)}px</div>
                </div>
            </div>

            {/* Zoom Control Buttons */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(0.25, prev - 0.25))}
                    className="flex-1 sm:flex-none w-12 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    disabled={!currentPlan.icon_svg || zoomLevel <= 0.25}
                    title="Zoom Out"
                >
                    <IconZoomOut size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                
                <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="flex-1 sm:flex-none w-16 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    disabled={!currentPlan.icon_svg || zoomLevel === 1}
                    title="Reset Zoom"
                >
                    Reset
                </button>
                
                <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(4, prev + 0.25))}
                    className="flex-1 sm:flex-none w-12 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    disabled={!currentPlan.icon_svg || zoomLevel >= 4}
                    title="Zoom In"
                >
                    <IconZoomIn size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
            </div>
        </div>
    </div>
    
    {/* Preview Area */}
    <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
        {currentPlan.icon_svg ? (
            <>
                {/* Grid Background */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px),
                                         linear-gradient(to bottom, #888 1px, transparent 1px)`,
                        backgroundSize: `${16 * zoomLevel}px ${16 * zoomLevel}px`,
                        backgroundPosition: 'center center'
                    }}
                ></div>
                
                {/* Center Guide Lines */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Horizontal Center Line */}
                    <div 
                        className="absolute left-0 right-0 h-px bg-blue-500/30 transform -translate-y-1/2"
                        style={{ top: '50%' }}
                    ></div>
                    {/* Vertical Center Line */}
                    <div 
                        className="absolute top-0 bottom-0 w-px bg-blue-500/30 transform -translate-x-1/2"
                        style={{ left: '50%' }}
                    ></div>
                    {/* Center Point */}
                    <div 
                        className="absolute w-1.5 h-1.5 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: '50%', top: '50%' }}
                    ></div>
                </div>
                
                {/* Icon Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                        className="relative transition-transform duration-300 ease-out"
                        style={{ 
                            transform: `scale(${zoomLevel})`,
                            width: '64px',
                            height: '64px'
                        }}
                    >
                        <div 
                            className="w-full h-full text-primary flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: currentPlan.icon_svg }} 
                        />
                        
                        {/* Bounding Box */}
                        <div className="absolute inset-0 border border-blue-400/30 rounded pointer-events-none"></div>
                        
                        {/* Size Indicator */}
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                            <div className="px-2 py-1 bg-gray-900/80 text-white text-xs rounded-md backdrop-blur-sm">
                                {Math.round(64 * zoomLevel)}×{Math.round(64 * zoomLevel)}px
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Zoom Level Indicator */}
                <div className="absolute top-3 left-3">
                    <div className="px-2 py-1 bg-gray-900/80 text-white text-xs rounded-md backdrop-blur-sm">
                        Zoom: {zoomLevel.toFixed(2)}×
                    </div>
                </div>
                
                {/* Grid Size Indicator */}
                <div className="absolute top-3 right-3">
                    <div className="px-2 py-1 bg-gray-900/80 text-white text-xs rounded-md backdrop-blur-sm">
                        Grid: {Math.round(16 * zoomLevel)}px
                    </div>
                </div>
                
                {/* Instructions */}
                <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
                            <div className="w-3 h-3 border border-gray-400"></div>
                            <span>Grid</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>Center</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
                            <IconZoomIn size={12} />
                            <span>Zoom controls</span>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            /* Empty State */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center mb-4">
                    <IconPhoto size={32} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    No icon uploaded
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                    Paste SVG code in the left panel to see a live preview here
                </p>
            </div>
        )}
    </div>
    
    {/* Quick Presets */}
    {currentPlan.icon_svg && (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Quick zoom levels:
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Click to set
                </span>
            </div>
            <div className="flex gap-2">
                {[0.5, 1, 1.5, 2, 3].map((level) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => setZoomLevel(level)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                            zoomLevel === level
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {level}×
                    </button>
                ))}
            </div>
        </div>
    )}
</div>
            </div>
        </div>

        {/* Color Theme */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                    Plan Theme Color
                </h4>
                {currentPlan.color_id && (
                    <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                        Selected
                    </span>
                )}
            </div>
            
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {availableColors.map((color) => {
                    const isSelected = currentPlan.color_id === color.id;
                    
                    return (
                        <button
                            key={color.id}
                            type="button"
                            onClick={() => handleChange('color_id', color.id)}
                            className={`relative group aspect-square rounded-lg flex items-center justify-center transition-all transform hover:scale-105 ${
                                isSelected 
                                    ? 'ring-2 ring-primary ring-offset-2 scale-105 shadow-lg' 
                                    : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                            }`}
                            style={{
                                background: color.is_gradient
                                    ? `linear-gradient(135deg, ${color.hex_start}, ${color.hex_end})`
                                    : color.hex_code,
                            }}
                            title={color.name}
                        >
                            {isSelected && (
                                <IconCheck size={16} className="text-white drop-shadow-md" />
                            )}
                            
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {color.name}
                            </div>
                        </button>
                    );
                })}
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Color theme affects plan cards and visual indicators throughout the interface.
            </p>
        </div>

        {/* Enhanced Preview Card */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Plan Card Preview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
                    {/* Background pattern based on selected color */}
                    {currentPlan.color_id && (
                        <div className="absolute inset-0 opacity-100">
                            <div 
                                className="w-full h-full"
                                style={{
                                    background: getSelectedColorBackground(.1),
                                    // maskImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20v20h20V20H20zm0 0V0h20v20H20z' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                                    // WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20v20h20V20H20zm0 0V0h20v20H20z' fill-rule='evenodd'/%3E%3C/svg%3E")`
                                }}
                            ></div>
                        </div>
                    )}
                    
                    <div className="relative flex items-start gap-4">
                        <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                                background: getSelectedColorBackground(1),
                                color: getSelectedColorText()
                            }}
                        >
                            {currentPlan.icon_svg ? (
                                <div 
                                    className="w-8 h-8"
                                    dangerouslySetInnerHTML={{ __html: currentPlan.icon_svg }} 
                                />
                            ) : (
                                <IconCurrencyDollar size={24} />
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                        {currentPlan.name || 'Plan Name'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {currentPlan.description || 'Plan description appears here'}
                                    </div>
                                </div>
                                {currentPlan.is_popular && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                                        <IconCrown size={10} />
                                        POPULAR
                                    </span>
                                )}
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <IconUsers size={14} className="text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {currentPlan.member_limit || 1} member{currentPlan.member_limit !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IconCoin size={14} className="text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {currentPlan.max_tokens?.toLocaleString() || '∞'} tokens
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {currentPlan.badge_label && (
                                <span className="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-2">
                                    {currentPlan.badge_label}
                                </span>
                            )}
                            {currentPlan.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${currentPlan.price || '0'}<span className="text-sm font-normal text-gray-500">/mo</span>
                        </div>
                    </div>
                </div>
                
                {/* Preview Info Panel */}
                <div className="space-y-4">
                    <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                        <h5 className="font-medium text-primary dark:text-primary-light mb-2 text-sm">
                            Preview Features
                        </h5>
                        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <IconCheck size={12} className="text-primary" />
                                <span>Dynamic icon background based on selected color</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <IconCheck size={12} className="text-primary" />
                                <span>Pattern overlay matching theme color</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <IconCheck size={12} className="text-primary" />
                                <span>Badge label and status indicators</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <IconCheck size={12} className="text-primary" />
                                <span>Popular plan highlight when enabled</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p className="mb-2">This preview shows how the plan will appear in:</p>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">Plan List</div>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">Checkout</div>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">Dashboard</div>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">Billing</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
                            </div>
                        </div>

                        {/* Fixed Footer with Action Buttons */}
                        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {hasChanges && (
                                        <span className="inline-flex items-center gap-2">
                                            <IconAlertCircle size={14} className="text-amber-500" />
                                            You have unsaved changes
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setIsOpen(false)} 
                                        className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave} 
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm hover:shadow-md"
                                        disabled={isSubmitting || !hasChanges || !currentPlan.name || !currentPlan.slug}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <IconRefresh size={16} className="animate-spin" />
                                                Saving...
                                            </span>
                                        ) : currentPlan.id ? 'Update Plan' : 'Create Plan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
    </Dialog>
</Transition>

            {/* ================= DELETE CONFIRMATION MODAL ================= */}
            <Transition appear show={isDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}>
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all border-2 border-red-500 dark:border-red-600">
                                    <div className="p-6">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <IconTrash size={32} className="text-red-600 dark:text-red-500" />
                                            </div>
                                            <Dialog.Title className="text-xl font-bold text-red-700 dark:text-red-400">
                                                Delete Plan?
                                            </Dialog.Title>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                                                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{planToDelete?.name}"</span>?
                                            </p>
                                        </div>

                                        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                                            <p className="text-sm text-amber-800 dark:text-amber-400">
                                                <IconAlertCircle size={16} className="inline mr-2" />
                                                This action cannot be undone. Teams currently using this plan will be affected.
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setIsDeleteModalOpen(false)} 
                                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleDelete} 
                                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <IconRefresh size={16} className="animate-spin" />
                                                        Deleting...
                                                    </span>
                                                ) : 'Delete Plan'}
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

export default PlanSettings;