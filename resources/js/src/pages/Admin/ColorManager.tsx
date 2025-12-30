import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Listbox, Popover } from '@headlessui/react';
import { 
    IconPlus, IconPencil, IconTrash, IconPalette, 
    IconCheck, IconX, IconBrush, IconInfoCircle,
    IconRefresh, IconSearch, IconFilter, IconPhoto,
    IconColorSwatch, IconSettings,
    IconAlertCircle, IconChevronDown, IconColorFilter
} from '@tabler/icons-react';
import { HexColorPicker } from "react-colorful";
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import DeleteModal from '../../components/DeleteModal';
import PerfectScrollbar from 'react-perfect-scrollbar';

const ColorManager = () => {
    const [colors, setColors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [colorToDelete, setColorToDelete] = useState<any>(null);
    
    // Search and Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const initialColorState = {
        name: '',
        hex_code: '#3b82f6',
        hex_dark: '#1d4ed8',
        is_gradient: false,
        hex_start: '#3b82f6',
        hex_end: '#2dd4bf',
        default_icon_svg: '',
        is_active: true,
        description: ''
    };

    const [currentColor, setCurrentColor] = useState<any>(initialColorState);

    const fetchColors = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/colors');
            setColors(res.data);
        } catch (e: any) { 
            toast.error(e.response?.data?.message || "Failed to load colors"); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchColors(); 
    }, []);

    const getContrastYIQ = (hex: string) => {
        if (!hex) return 'text-white';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? 'text-black' : 'text-white';
    };

    const handleOpenCreate = () => {
        setIsEditing(false);
        setCurrentColor(initialColorState);
        setIsOpen(true);
    };

    const handleOpenEdit = (color: any) => {
        setIsEditing(true);
        setCurrentColor(color);
        setIsOpen(true);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/admin/colors/${currentColor.id}`, currentColor);
                toast.success("Color theme updated successfully");
            } else {
                await api.post('/admin/colors', currentColor);
                toast.success("New color theme created");
            }
            setIsOpen(false);
            fetchColors();
        } catch (e: any) { 
            toast.error(e.response?.data?.message || "Error saving color settings"); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!colorToDelete) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/admin/colors/${colorToDelete.id}`);
            toast.success('Color theme deleted successfully');
            setColors(colors.filter(c => c.id !== colorToDelete.id));
            setIsDeleteModalOpen(false);
            setColorToDelete(null);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to delete color theme');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (color: any) => {
        setColorToDelete(color);
        setIsDeleteModalOpen(true);
    };

    // Filter colors
    const filteredColors = colors.filter(color => {
        const matchesSearch = !searchTerm || 
            color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            color.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter === 'all' || 
            (typeFilter === 'gradient' && color.is_gradient) ||
            (typeFilter === 'solid' && !color.is_gradient);
        
        return matchesSearch && matchesType;
    });

    // Loading skeleton
    if (loading) {
        return (
            <div className="p-6">
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

                {/* Filter Bar Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6 animate-pulse">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-full sm:w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-full sm:w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Color Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-0 overflow-hidden animate-pulse">
                            <div className="h-32 bg-gray-200 dark:bg-gray-700 w-full"></div>
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                    </div>
                                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                </div>
                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* ================= HEADER ================= */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <IconPalette size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Color Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                                Manage color themes and gradients for plan customization
                            </p>
                        </div>
                    </div>
                    
                    {/* Stats Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-500/10 dark:to-purple-500/5 text-purple-700 dark:text-purple-400 rounded-full font-medium border border-purple-200 dark:border-purple-500/20">
                        <IconPalette size={16} />
                        <span className="font-bold">{colors.length}</span> Color Themes
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle className="text-purple-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Color Themes</h3>
                            <p className="text-purple-700 dark:text-purple-400 text-sm">
                                Create solid colors or gradients that can be assigned to plans for visual customization. Each theme can include a custom SVG icon.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= FILTER BAR ================= */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        {/* Search */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search colors by name or description..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        {/* Type Filter */}
                        <div className="w-full sm:w-48">
                            <Listbox value={typeFilter} onChange={setTypeFilter}>
                                <div className="relative">
                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                        <span className="flex items-center gap-2 truncate">
                                            <IconFilter size={16} className="text-gray-400" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {typeFilter === 'all' ? 'All Types' : 
                                                 typeFilter === 'gradient' ? 'Gradients Only' : 'Solid Colors Only'}
                                            </span>
                                        </span>
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <IconChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </Listbox.Button>

                                    <Listbox.Options className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none max-h-60 overflow-auto">
                                        {['all', 'solid', 'gradient'].map((type) => (
                                            <Listbox.Option key={type} value={type}>
                                                {({ active }) => (
                                                    <div className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {type === 'all' ? 'All Types' : 
                                                         type === 'gradient' ? (
                                                            <>
                                                                <IconColorSwatch size={14} />
                                                                Gradients Only
                                                            </>
                                                        ) : (
                                                            <>
                                                                <IconColorSwatch size={14} />
                                                                Solid Colors Only
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            </Listbox>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchColors}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                            <IconRefresh size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={handleOpenCreate}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                            <IconPlus size={18} />
                            New Color Theme
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= COLOR GRID ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredColors.length === 0 ? (
                    <div className="md:col-span-4">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-500/10 dark:to-purple-500/5 flex items-center justify-center mx-auto mb-6">
                                <IconPalette size={32} className="text-purple-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                {searchTerm ? 'No Colors Found' : 'No Color Themes Yet'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                                {searchTerm 
                                    ? `No color themes match "${searchTerm}". Try a different search term.`
                                    : 'Start by creating your first color theme for plan customization.'
                                }
                            </p>
                            <button
                                onClick={handleOpenCreate}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                                <IconPlus size={18} />
                                Create First Theme
                            </button>
                        </div>
                    </div>
                ) : (
                    filteredColors.map((color) => (
                        <div 
                            key={color.id} 
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-lg transition-all group"
                        >
                            {/* Color Preview */}
                            <div 
                                className="h-32 w-full relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300"
                                style={{ 
                                    background: color.is_gradient 
                                        ? `linear-gradient(135deg, ${color.hex_start}, ${color.hex_end})` 
                                        : color.hex_code 
                                }}
                            >
                                {/* Status Badge */}
                                <div className="absolute top-3 right-3">
                                    {color.is_active ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                            <IconCheck size={12} />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                                            <IconX size={12} />
                                            Inactive
                                        </span>
                                    )}
                                </div>

                                {/* Icon Preview */}
                                {color.default_icon_svg && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div 
                                            className={`w-12 h-12 ${getContrastYIQ(color.is_gradient ? color.hex_start : color.hex_code)}`}
                                            dangerouslySetInnerHTML={{ __html: color.default_icon_svg }} 
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Color Info */}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                                            {color.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                color.is_gradient
                                                    ? 'bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-500/10 dark:to-purple-500/5 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30'
                                                    : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                                            }`}>
                                                {color.is_gradient ? <IconColorFilter size={12} /> : <IconColorSwatch size={12} />}
                                                {color.is_gradient ? 'Gradient' : 'Solid'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Color Codes */}
                                <div className="space-y-2 mb-5">
                                    {color.is_gradient ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-xs">
                                                <div className="text-gray-500 dark:text-gray-400 mb-1">Start Color</div>
                                                <div className="font-mono text-gray-900 dark:text-gray-300">{color.hex_start}</div>
                                            </div>
                                            <div className="text-xs">
                                                <div className="text-gray-500 dark:text-gray-400 mb-1">End Color</div>
                                                <div className="font-mono text-gray-900 dark:text-gray-300">{color.hex_end}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs">
                                            <div className="text-gray-500 dark:text-gray-400 mb-1">Hex Code</div>
                                            <div className="font-mono text-gray-900 dark:text-gray-300">{color.hex_code}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(color)}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg border border-primary/20 transition-colors"
                                    >
                                        <IconPencil size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleOpenDeleteModal(color)}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/30 transition-colors"
                                    >
                                        <IconTrash size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ================= CREATE/EDIT MODAL ================= */}
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
                                <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <IconPalette size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {isEditing ? 'Edit Color Theme' : 'Create New Color Theme'}
                                                </Dialog.Title>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    {isEditing 
                                                        ? 'Update your color theme configuration' 
                                                        : 'Configure a new color theme for plans'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* Left Column: Basic Info */}
                                            <div className="lg:col-span-2 space-y-6">
                                                {/* Basic Information */}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                                                        Basic Information
                                                    </h3>
                                                    
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Theme Name <span className="text-red-500">*</span>
                                                            </label>
                                                            <input 
                                                                type="text" 
                                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                                value={currentColor.name}
                                                                onChange={(e) => setCurrentColor({...currentColor, name: e.target.value})}
                                                                placeholder="e.g., Ocean Blue"
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Description
                                                            </label>
                                                            <textarea 
                                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                                value={currentColor.description || ''}
                                                                onChange={(e) => setCurrentColor({...currentColor, description: e.target.value})}
                                                                placeholder="Brief description of this color theme"
                                                                rows={2}
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>

                                                        {/* Gradient Toggle */}
                                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                    <IconColorFilter size={20} className="text-primary" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900 dark:text-white">Gradient Theme</div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                        Create a gradient color instead of solid
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="sr-only peer"
                                                                    checked={currentColor.is_gradient}
                                                                    onChange={(e) => setCurrentColor({...currentColor, is_gradient: e.target.checked})}
                                                                    disabled={isSubmitting}
                                                                />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Color Configuration */}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                                                        Color Configuration
                                                    </h3>
                                                    
                                                    {currentColor.is_gradient ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <ColorInput 
                                                                label="Start Color"
                                                                value={currentColor.hex_start}
                                                                onChange={(val: string) => setCurrentColor({...currentColor, hex_start: val})}
                                                                disabled={isSubmitting}
                                                            />
                                                            <ColorInput 
                                                                label="End Color"
                                                                value={currentColor.hex_end}
                                                                onChange={(val: string) => setCurrentColor({...currentColor, hex_end: val})}
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <ColorInput 
                                                                label="Main Color"
                                                                value={currentColor.hex_code}
                                                                onChange={(val: string) => setCurrentColor({...currentColor, hex_code: val})}
                                                                disabled={isSubmitting}
                                                            />
                                                            <ColorInput 
                                                                label="Dark Variant"
                                                                value={currentColor.hex_dark}
                                                                onChange={(val: string) => setCurrentColor({...currentColor, hex_dark: val})}
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Icon Configuration */}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                                                        Icon Configuration
                                                    </h3>
                                                    
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Default SVG Icon
                                                        </label>
                                                        <div className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                                                            <PerfectScrollbar className="h-[150px]">
                                                                <textarea 
                                                                    className="w-full px-4 py-3 bg-transparent border-0 focus:ring-0 font-mono text-sm resize-none min-h-[150px] text-gray-900 dark:text-gray-100"
                                                                    rows={4}
                                                                    placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="..."/></svg>'
                                                                    value={currentColor.default_icon_svg}
                                                                    onChange={(e) => setCurrentColor({...currentColor, default_icon_svg: e.target.value})}
                                                                    disabled={isSubmitting}
                                                                />
                                                            </PerfectScrollbar>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                            Optional. SVG code for the default icon that appears with this color theme.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Preview */}
                                            <div className="space-y-6">
                                                {/* Live Preview */}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                                                        Live Preview
                                                    </h3>
                                                    
                                                    <div 
                                                        className="w-full h-48 rounded-xl flex flex-col items-center justify-center p-6 transition-all duration-300"
                                                        style={{ 
                                                            background: currentColor.is_gradient 
                                                                ? `linear-gradient(135deg, ${currentColor.hex_start}, ${currentColor.hex_end})` 
                                                                : currentColor.hex_code 
                                                        }}
                                                    >
                                                        {currentColor.default_icon_svg ? (
                                                            <div 
                                                                className={`w-16 h-16 mb-4 ${getContrastYIQ(currentColor.is_gradient ? currentColor.hex_start : currentColor.hex_code)}`}
                                                                dangerouslySetInnerHTML={{ __html: currentColor.default_icon_svg }} 
                                                            />
                                                        ) : (
                                                            <div className={`w-16 h-16 mb-4 flex items-center justify-center ${getContrastYIQ(currentColor.is_gradient ? currentColor.hex_start : currentColor.hex_code)}`}>
                                                                <IconPalette size={32} />
                                                            </div>
                                                        )}
                                                        
                                                        <div className={`text-center ${getContrastYIQ(currentColor.is_gradient ? currentColor.hex_start : currentColor.hex_code)}`}>
                                                            <div className="text-lg font-bold mb-2">{currentColor.name || 'Theme Name'}</div>
                                                            <div className="text-sm opacity-90">
                                                                {currentColor.is_gradient ? 'Gradient Theme' : 'Solid Color'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                                        <div className="flex items-center gap-2">
                                                            <IconCheck size={16} className="text-emerald-500" />
                                                            <span className="text-sm text-emerald-700 dark:text-emerald-400">
                                                                Preview shows real-time color contrast
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Toggle */}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                                                        Status
                                                    </h3>
                                                    
                                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">Theme Status</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                Active themes can be assigned to plans
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                className="sr-only peer"
                                                                checked={currentColor.is_active}
                                                                onChange={(e) => setCurrentColor({...currentColor, is_active: e.target.checked})}
                                                                disabled={isSubmitting}
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                                            <button 
                                                onClick={() => setIsOpen(false)} 
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSave} 
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                                disabled={isSubmitting || !currentColor.name}
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <IconRefresh size={16} className="animate-spin" />
                                                        Saving...
                                                    </span>
                                                ) : isEditing ? 'Update Theme' : 'Create Theme'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* ================= DELETE MODAL ================= */}
            <DeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                title="Delete Color Theme?"
                message={`Are you sure you want to delete "${colorToDelete?.name}"? This will remove this color theme from any plans using it.`}
                onConfirm={handleDelete}
                confirmButtonText="Delete Theme"
                cancelButtonText="Cancel"
                isLoading={isSubmitting}
            />
        </div>
    );
};

const ColorInput = ({ label, value, onChange, disabled }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
        </label>
        <div className="flex items-center gap-3">
            <Popover className="relative">
                <Popover.Button 
                    className="w-10 h-10 rounded-lg border-2 border-white dark:border-gray-800 shadow-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: value }}
                    disabled={disabled}
                />
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                >
                    <Popover.Panel className="absolute z-[100] mt-2 left-0">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
                            <HexColorPicker color={value} onChange={onChange} />
                        </div>
                    </Popover.Panel>
                </Transition>
            </Popover>
            
            <div className="flex-1">
                <input 
                    type="text" 
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    disabled={disabled}
                />
            </div>
        </div>
    </div>
);

export default ColorManager;