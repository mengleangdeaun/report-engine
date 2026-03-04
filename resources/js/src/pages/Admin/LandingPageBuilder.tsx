import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactSortable } from 'react-sortablejs';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../utils/api';
import { THEME_COLORS } from '../../constants/themeColors';
import { IconTrash, IconPlus, IconGripVertical, IconUpload, IconLoader, IconCheck, IconBrush, IconSearch } from '@tabler/icons-react';
import * as TablerIcons from '@tabler/icons-react';

// Shadcn UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Slider } from '../../components/ui/slider';
import { ScrollArea } from '../../components/ui/scroll-area';
import { CustomQuillEditor } from '../../components/ui/custom_quill_editor';

const FONTS = [
    { label: 'Google Sans (Default)', value: 'Google Sans', preview: 'font-[Google Sans]' },
    { label: 'Kantumruy Pro', value: '"Kantumruy Pro", sans-serif', preview: 'font-[Kantumruy_Pro]' },
    { label: 'Dangrek', value: 'Dangrek, sans-serif', preview: 'font-[Dangrek]' },
    { label: 'Nunito', value: 'Nunito', preview: 'font-[Nunito]' },
    { label: 'Inter', value: 'Inter, sans-serif', preview: 'font-[Inter]' },
    { label: 'Roboto', value: 'Roboto, sans-serif', preview: 'font-[Roboto]' },
    { label: 'DM Sans', value: 'DM Sans, sans-serif', preview: 'font-[DM Sans]' },
    { label: 'Poppins', value: 'Poppins, sans-serif', preview: 'font-[Poppins]' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif', preview: 'font-[Montserrat]' },
    { label: 'Ubuntu', value: 'Ubuntu, sans-serif', preview: 'font-[Ubuntu]' },
    { label: 'System UI', value: 'system-ui, sans-serif', preview: '' },
];

// Helper: convert hex to HSL object
function hexToHsl(hex: string): { h: number; s: number; l: number } {
    let r = 0, g = 0, b = 0;
    if (!hex) return { h: 0, s: 0, l: 0 };
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Helper: HSL to CSS string
function hslToString(h: number, s: number, l: number): string {
    return `${h} ${s}% ${l}%`;
}

// Icon Helper
const renderIcon = (iconName: string, className?: string) => {
    if (!iconName) return <TablerIcons.IconCircle className={className || 'w-5 h-5'} />;
    let name = iconName.startsWith('Icon') ? iconName : `Icon${iconName.charAt(0).toUpperCase() + iconName.slice(1)}`;
    name = name.replace(/-./g, (x) => x[1].toUpperCase());
    const IconComponent = (TablerIcons as any)[name];
    if (IconComponent) return <IconComponent className={className || 'w-5 h-5'} />;
    return <TablerIcons.IconCircle className={className || 'w-5 h-5'} />;
};

// Common Icons for the Picker
const COMMON_ICONS = [
    // Basic
    'Star', 'Heart', 'Shield', 'Zap', 'Rocket', 'Settings',
    'User', 'Users', 'Mail', 'Phone',
    'MapPin', 'Clock', 'Calendar', 'Camera', 'Video', 'Music',
    'Cloud', 'Download', 'Upload',
    'Search', 'Menu', 'X', 'Check', 'InfoCircle', 'AlertCircle',
    'ExternalLink', 'Link',

    // Social
    'BrandFacebook', 'BrandTwitter', 'BrandInstagram',
    'BrandLinkedin', 'BrandYoutube', 'BrandTiktok',
    'BrandTelegram', 'BrandWhatsapp', 'BrandMessenger',

    // Layout / Platform
    'Layout', 'LayoutDashboard', 'LayoutGrid',
    'Grid', 'List', 'Browser', 'World', 'Sitemap',
    'Server', 'Database', 'LayersLinked',
    'DeviceLaptop', 'DeviceMobile', 'DeviceDesktop',

    // About Us
    'UserCheck', 'UserStar', 'Building', 'Briefcase',
    'Target', 'Award', 'Certificate',
    'HeartHandshake', 'History', 'Flag',

    // Features
    'ShieldCheck', 'Lock', 'Adjustments',
    'Gauge', 'Bolt', 'ThumbUp', 'Api', 'Cpu',

    // Platform Overview / Analytics
    'ChartBar', 'ChartLine', 'ChartPie', 'Activity',

    // CTA / Actions
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'ArrowUpRight',
    'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
    'Plus', 'Minus', 'Edit', 'Trash',
    'PlayerPlay', 'Send', 'MessageCircle', 'CalendarEvent'
];

const IconPicker = ({ value, onChange, placeholder = "Select Icon" }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredIcons = COMMON_ICONS.filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between gap-2 px-3 h-10">
                    <div className="flex items-center gap-2 truncate">
                        {renderIcon(value, "w-4 h-4 shrink-0")}
                        <span className="truncate text-xs">{value || placeholder}</span>
                    </div>
                    <IconSearch size={14} className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl overflow-hidden" align="start">
                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative">
                        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search icons..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-xs border-none bg-gray-50 dark:bg-gray-900 focus-visible:ring-0"
                        />
                    </div>
                </div>
                <ScrollArea className="h-60 p-2">
                    <div className="grid grid-cols-4 gap-1">
                        {filteredIcons.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => {
                                    onChange(icon);
                                    setIsOpen(false);
                                }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${value === icon ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                title={icon}
                            >
                                {renderIcon(icon, "w-5 h-5")}
                                <span className="text-[10px] mt-1 truncate w-full text-center">{icon}</span>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
                {filteredIcons.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                        No icons found for "{search}"
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

const defaultSections = [
    { id: 'hero', name: 'Hero', enabled: true },
    { id: 'features', name: 'Features', enabled: true },
    { id: 'about', name: 'About', enabled: true },
    { id: 'whyUs', name: 'Why Us', enabled: true },
    { id: 'screenshots', name: 'Gallery/Platform Overview', enabled: true },
    { id: 'reviews', name: 'Reviews', enabled: true },
    { id: 'faq', name: 'FAQ', enabled: true },
    { id: 'contact', name: 'Contact', enabled: true }
];

const LandingPageBuilder = () => {
    const dispatch = useDispatch();
    useEffect(() => { dispatch(setPageTitle('Landing Page Builder')); }, [dispatch]);
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [removeFavicon, setRemoveFavicon] = useState(false);

    const [config, setConfig] = useState<any>({
        // General
        companyName: '', contactEmail: '', contactPhone: '', contactAddress: '', googleMapLink: '',
        fontFamily: 'Google Sans',
        themeColors: { primary: 'blue', secondary: 'purple', accent: 'cyan' },
        sectionOrder: defaultSections,
        logoUrl: '', faviconUrl: '',

        // Layout
        header: {
            style: 'transparent',
            enabled: true,
            bgColor: '#ffffff',
            textColor: '#000000',
            buttonStyle: 'solid',
            menuItems: [
                { name: 'Features', link: '#features', enabled: true },
                { name: 'Pricing', link: '#pricing', enabled: true },
                { name: 'About', link: '#about', enabled: true },
                { name: 'Contact', link: '#contact', enabled: true }
            ]
        },
        hero: {
            layout: 'contentLeft', enabled: true, style: 'default', height: '100vh',
            title: '', subtitle: '', badge: '',
            primaryBtnText: '', primaryBtnLink: '', primaryBtnEnabled: true,
            secondaryBtnText: '', secondaryBtnLink: '', secondaryBtnEnabled: true,
            imageUrl: '', imagePos: 'right',
            bgColor: '#ffffff', textColor: '#000000', bgOverlay: false, overlayColor: 'rgba(0,0,0,0.5)'
        },
        footer: {
            enabled: true, content: '', description: '',
            socialLinks: [], footerLinks: []
        },

        // Content
        features: {
            enabled: true, layout: 'grid', style: 'default', columns: '3',
            title: '', description: '', displayIcon: true,
            bgColor: '#f8fafc', imageUrl: '',
            boxes: []
        },
        screenshots: {
            enabled: true, title: '', subtitle: '', gallery: []
        },
        whyUs: {
            enabled: true, title: '', subtitle: '', reasons: [], ctaTitle: '', ctaSubtitle: ''
        },
        about: {
            enabled: true, layout: 'contentLeft', style: 'default', imagePos: 'right',
            title: '', description: '', storyTitle: '', storyContent: '',
            imageUrl: '', bgColor: '#ffffff', parallax: false
        },

        // Social
        reviews: {
            enabled: true, title: '', subtitle: '', testimonials: []
        },

        // Engagement
        faq: {
            enabled: true, title: '', subtitle: '', ctaText: '', btnText: '', btnUrl: '', items: []
        },
        contact: {
            enabled: true, title: '', subtitle: '', formTitle: '', infoTitle: '', infoDescription: ''
        },

        // Legal
        termsOfService: '', privacyPolicy: ''
    });

    const [isCustomColor, setIsCustomColor] = useState(false);
    const [customHsl, setCustomHsl] = useState<{ h: number; s: number; l: number }>({ h: 198, s: 100, l: 50 });

    useEffect(() => {
        if (config.themeColors?.primary === 'custom' && config.themeColors?.customPrimary) {
            setIsCustomColor(true);
            setCustomHsl(config.themeColors.customPrimary);
        } else if (config.themeColors?.primary === 'custom') {
            setIsCustomColor(true);
        } else {
            setIsCustomColor(false);
        }
    }, [config.themeColors?.primary]);

    const handleCustomColorChange = (newHsl: { h: number; s: number; l: number }) => {
        setCustomHsl(newHsl);
        setConfig((prev: any) => ({
            ...prev,
            themeColors: {
                ...prev.themeColors,
                primary: 'custom',
                customPrimary: newHsl
            }
        }));
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/landing-page/config');
                if (res.data) {
                    // Deep merge the fetched data with the default structure to prevent missing key errors
                    setConfig((prev: any) => ({
                        ...prev,
                        ...res.data,
                        themeColors: { ...prev.themeColors, ...(res.data.themeColors || {}) },
                        header: {
                            ...prev.header,
                            ...(res.data.header || {}),
                            menuItems: res.data.header?.menuItems || prev.header.menuItems
                        },
                        hero: { ...prev.hero, ...(res.data.hero || {}) },
                        footer: { ...prev.footer, ...(res.data.footer || {}) },
                        features: { ...prev.features, ...(res.data.features || {}) },
                        screenshots: { ...prev.screenshots, ...(res.data.screenshots || {}) },
                        whyUs: { ...prev.whyUs, ...(res.data.whyUs || {}) },
                        about: { ...prev.about, ...(res.data.about || {}) },
                        reviews: { ...prev.reviews, ...(res.data.reviews || {}) },
                        faq: { ...prev.faq, ...(res.data.faq || {}) },
                        contact: { ...prev.contact, ...(res.data.contact || {}) },
                        sectionOrder: res.data.sectionOrder ? res.data.sectionOrder : prev.sectionOrder,
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch config', error);
                toast.error('Failed to load configuration');
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleChange = (section: string, field: string, value: any) => {
        if (!section) {
            setConfig((prev: any) => ({ ...prev, [field]: value }));
        } else {
            setConfig((prev: any) => {
                const newConfig = {
                    ...prev,
                    [section]: { ...prev[section], [field]: value }
                };

                // Sync visibility if 'enabled' field is changed
                if (field === 'enabled') {
                    const newOrder = [...prev.sectionOrder];
                    const idx = newOrder.findIndex(s => s.id === section);
                    if (idx !== -1) {
                        newOrder[idx] = { ...newOrder[idx], enabled: value };
                        newConfig.sectionOrder = newOrder;
                    }
                }

                return newConfig;
            });
        }
    };

    const moveSection = useCallback((idx: number, direction: 'up' | 'down') => {
        // This function is now deprecated but kept for backward compatibility if needed elsewhere
        const newOrder = [...config.sectionOrder];
        if (direction === 'up' && idx > 0) {
            [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
        } else if (direction === 'down' && idx < newOrder.length - 1) {
            [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
        }
        handleChange('', 'sectionOrder', newOrder);
    }, [config.sectionOrder, handleChange]); // Added handleChange to dependency array

    const handleSortChange = (newState: any[]) => {
        // ReactSortable gives us the full objects back, so we can directly update sectionOrder
        handleChange('', 'sectionOrder', newState);
    };

    const handleArrayChange = (section: string, arrayName: string, index: number, field: string, value: any) => {
        setConfig((prev: any) => {
            const newArray = [...prev[section][arrayName]];
            newArray[index] = { ...newArray[index], [field]: value };
            return {
                ...prev,
                [section]: { ...prev[section], [arrayName]: newArray }
            };
        });
    };

    const addArrayItem = (section: string, arrayName: string, defaultItem: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [section]: { ...prev[section], [arrayName]: [...prev[section][arrayName], defaultItem] }
        }));
    };

    const removeArrayItem = (section: string, arrayName: string, index: number) => {
        setConfig((prev: any) => {
            const newArray = [...prev[section][arrayName]];
            newArray.splice(index, 1);
            return {
                ...prev,
                [section]: { ...prev[section], [arrayName]: newArray }
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (url: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('image', e.target.files[0]);
            try {
                const toastId = toast.loading('Uploading image...');
                const res = await api.post('/admin/landing-page/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Image uploaded', { id: toastId });
                onSuccess(res.data.url);
            } catch (err) {
                toast.error('Failed to upload image');
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();

            // Append base string fields
            formData.append('companyName', config.companyName);
            formData.append('contactEmail', config.contactEmail);
            formData.append('contactPhone', config.contactPhone);
            formData.append('contactAddress', config.contactAddress);
            formData.append('googleMapLink', config.googleMapLink);
            formData.append('fontFamily', config.fontFamily);
            formData.append('termsOfService', config.termsOfService);
            formData.append('privacyPolicy', config.privacyPolicy);

            // Append JSON fields
            formData.append('themeColors', JSON.stringify(config.themeColors));
            formData.append('sectionOrder', JSON.stringify(config.sectionOrder));
            formData.append('header', JSON.stringify(config.header));
            formData.append('hero', JSON.stringify(config.hero));
            formData.append('footer', JSON.stringify(config.footer));
            formData.append('features', JSON.stringify(config.features));
            formData.append('screenshots', JSON.stringify(config.screenshots));
            formData.append('whyUs', JSON.stringify(config.whyUs));
            formData.append('about', JSON.stringify(config.about));
            formData.append('reviews', JSON.stringify(config.reviews));
            formData.append('faq', JSON.stringify(config.faq));
            formData.append('contact', JSON.stringify(config.contact));

            if (logoFile) formData.append('logo', logoFile);
            if (removeLogo) formData.append('removeLogo', 'true');
            if (faviconFile) formData.append('favicon', faviconFile);
            if (removeFavicon) formData.append('removeFavicon', 'true');

            const apiCall = api.post('/admin/landing-page/config', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const res = await toast.promise(apiCall, {
                loading: 'Saving landing page configuration...',
                success: 'Landing page configuration updated successfully!',
                error: (error: any) => error.response?.data?.message || 'Failed to save configuration',
            });

            if (res.data?.config) {
                setLogoFile(null);
                setFaviconFile(null);
                setRemoveLogo(false);
                setRemoveFavicon(false);
                // Also update local URL references to clear the visual states
                setConfig((prev: any) => ({ ...prev, logoUrl: res.data.config.logoUrl, faviconUrl: res.data.config.faviconUrl }));
            }
        } catch (error: any) {
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-40"><span className="animate-spin border-4 border-primary border-t-transparent rounded-full w-10 h-10"></span></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Landing Page Builder</h2>
                    <p className="text-gray-500 dark:text-gray-400">Configure public-facing website contents, styles, and integrations.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} size="lg" className="shrink-0 group">
                    {isSaving ? (
                        <span className="animate-spin mr-2"><IconLoader className="h-4 w-4" /></span>
                    ) : (
                        <IconUpload className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <Tabs defaultValue="setup" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="setup" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 py-3 lg:py-1">Set Up</TabsTrigger>
                    <TabsTrigger value="layout" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 py-3 lg:py-1">Layout</TabsTrigger>
                    <TabsTrigger value="content" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 py-3 lg:py-1">Content</TabsTrigger>
                    <TabsTrigger value="social" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 py-3 lg:py-1">Social</TabsTrigger>
                    <TabsTrigger value="engagement" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 py-3 lg:py-1">Engagement</TabsTrigger>
                </TabsList>

                {/* --- 1. SET UP TAB --- */}
                <TabsContent value="setup" className="space-y-6 mt-6 focus-visible:outline-none">
                    <Tabs defaultValue="company" className="w-full">
                        <TabsList className="flex w-fit bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-none p-0 h-auto mb-6 gap-6">
                            <TabsTrigger value="company" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2 px-1 text-sm font-medium transition-none">Company information</TabsTrigger>
                            <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2 px-1 text-sm font-medium transition-none">Appearance settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="company" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Company Information</CardTitle>
                                    <CardDescription>Primary details used across the landing page and footers.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Company Name</Label>
                                        <Input value={config.companyName} onChange={e => handleChange('', 'companyName', e.target.value)} placeholder="Acme Inc." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact Email</Label>
                                        <Input value={config.contactEmail} onChange={e => handleChange('', 'contactEmail', e.target.value)} type="email" placeholder="support@acme.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact Phone</Label>
                                        <Input value={config.contactPhone} onChange={e => handleChange('', 'contactPhone', e.target.value)} placeholder="+1 (555) 000-0000" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact Address</Label>
                                        <Input value={config.contactAddress} onChange={e => handleChange('', 'contactAddress', e.target.value)} placeholder="123 Main St, City" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Google Map Link</Label>
                                        <Input value={config.googleMapLink} onChange={e => handleChange('', 'googleMapLink', e.target.value)} placeholder="https://maps.google.com/..." />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Legal Documents</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col md:flex-row gap-6">
                                    <div className="space-y-2">
                                        <Label>Terms of Service</Label>
                                        <CustomQuillEditor value={config.termsOfService} onChange={v => handleChange('', 'termsOfService', v)} placeholder="Terms of Service..." variant="default" insideCard={true} minHeight={200} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Privacy Policy</Label>
                                        <CustomQuillEditor value={config.privacyPolicy} onChange={v => handleChange('', 'privacyPolicy', v)} placeholder="Privacy Policy..." variant="default" insideCard={true} minHeight={200} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="appearance" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appearance settings</CardTitle>
                                    <CardDescription>Define the brand attributes including logos, fonts and colors.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Primary Logo</Label>
                                            <div className="flex items-center gap-4 border p-2 rounded-md bg-gray-50 dark:bg-gray-900 border-dashed">
                                                {(config.logoUrl && !removeLogo && !logoFile) && (
                                                    <div className="relative">
                                                        <img src={config.logoUrl} alt="Logo" className="h-10 w-auto object-contain bg-white dark:bg-black p-1 rounded" />
                                                        <button type="button" onClick={() => setRemoveLogo(true)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1"><IconTrash size={12} /></button>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <Input type="file" accept="image/*" onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) { setLogoFile(e.target.files[0]); setRemoveLogo(false); }
                                                    }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Favicon</Label>
                                            <div className="flex items-center gap-4 border p-2 rounded-md bg-gray-50 dark:bg-gray-900 border-dashed">
                                                {(config.faviconUrl && !removeFavicon && !faviconFile) && (
                                                    <div className="relative">
                                                        <img src={config.faviconUrl} alt="Favicon" className="h-10 w-10 object-contain bg-white dark:bg-black p-1 rounded" />
                                                        <button type="button" onClick={() => setRemoveFavicon(true)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1"><IconTrash size={12} /></button>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <Input type="file" accept="image/*,.ico" onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) { setFaviconFile(e.target.files[0]); setRemoveFavicon(false); }
                                                    }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Font Family</Label>
                                            <Select value={config.fontFamily} onValueChange={v => handleChange('', 'fontFamily', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a font" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FONTS.map(font => (
                                                        <SelectItem key={font.value} value={font.value}>
                                                            <span className={font.preview}>{font.label}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4">
                                            <Label>Primary Theme Color</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {THEME_COLORS.map((color: any) => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setIsCustomColor(false);
                                                            handleChange('themeColors', 'primary', color.value);
                                                        }}
                                                        className="group relative flex flex-col items-center gap-1.5"
                                                        title={color.label}
                                                    >
                                                        <div
                                                            className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center ${config.themeColors.primary === color.value && !isCustomColor
                                                                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                                                                : 'hover:scale-105'
                                                                }`}
                                                            style={{ backgroundColor: color.hex }}
                                                        >
                                                            {config.themeColors.primary === color.value && !isCustomColor && (
                                                                <IconCheck size={16} className="text-white drop-shadow-sm" />
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] font-medium ${config.themeColors.primary === color.value && !isCustomColor
                                                            ? 'text-gray-900 dark:text-gray-100'
                                                            : 'text-gray-400 dark:text-gray-500'
                                                            }`}>{color.label}</span>
                                                    </button>
                                                ))}

                                                {/* Custom color picker */}
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCustomColor(true)}
                                                            className="group relative flex flex-col items-center gap-1.5"
                                                            title="Custom color"
                                                        >
                                                            <div
                                                                className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 ${isCustomColor ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110' : 'hover:scale-105'
                                                                    }`}
                                                            >
                                                                {isCustomColor && <IconBrush size={16} className="text-white drop-shadow-sm" />}
                                                            </div>
                                                            <span className={`text-[10px] font-medium ${isCustomColor ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                                                                }`}>Custom</span>
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl">
                                                        <div className="space-y-4">
                                                            <h4 className="font-medium text-sm">Custom primary color</h4>
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700"
                                                                    style={{ backgroundColor: `hsl(${customHsl.h}, ${customHsl.s}%, ${customHsl.l}%)` }}
                                                                />
                                                                <Input
                                                                    type="color"
                                                                    value={(() => {
                                                                        // Simple HSL to Hex approximate for the input
                                                                        const l = customHsl.l / 100;
                                                                        const a = (customHsl.s * Math.min(l, 1 - l)) / 100;
                                                                        const f = (n: number) => {
                                                                            const k = (n + customHsl.h / 30) % 12;
                                                                            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                                                                            return Math.round(255 * color).toString(16).padStart(2, '0');
                                                                        };
                                                                        return `#${f(0)}${f(8)}${f(4)}`;
                                                                    })()}
                                                                    onChange={(e) => {
                                                                        const hsl = hexToHsl(e.target.value);
                                                                        handleCustomColorChange(hsl);
                                                                    }}
                                                                    className="w-full h-10"
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <Label className="text-xs">Hue: {customHsl.h}°</Label>
                                                                    <Slider
                                                                        value={[customHsl.h]}
                                                                        min={0}
                                                                        max={360}
                                                                        step={1}
                                                                        onValueChange={([h]) => handleCustomColorChange({ ...customHsl, h })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Saturation: {customHsl.s}%</Label>
                                                                    <Slider
                                                                        value={[customHsl.s]}
                                                                        min={0}
                                                                        max={100}
                                                                        step={1}
                                                                        onValueChange={([s]) => handleCustomColorChange({ ...customHsl, s })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Lightness: {customHsl.l}%</Label>
                                                                    <Slider
                                                                        value={[customHsl.l]}
                                                                        min={0}
                                                                        max={100}
                                                                        step={1}
                                                                        onValueChange={([l]) => handleCustomColorChange({ ...customHsl, l })}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="pt-2">
                                                                <Button
                                                                    type="button"
                                                                    className="w-full gap-2"
                                                                    style={{
                                                                        backgroundColor: `hsl(${customHsl.h}, ${customHsl.s}%, ${customHsl.l}%)`,
                                                                        color: '#fff'
                                                                    }}
                                                                >
                                                                    Preview
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* --- 2. LAYOUT TAB --- */}
                <TabsContent value="layout" className="space-y-6 mt-6 focus-visible:outline-none">
                    <Tabs defaultValue="ordering" className="w-full">
                        <TabsList className="flex w-fit bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-none p-0 h-auto mb-6 gap-6">
                            <TabsTrigger value="ordering" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2 px-1 text-sm font-medium transition-none">Section order</TabsTrigger>
                            <TabsTrigger value="header_footer" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2 px-1 text-sm font-medium transition-none">Header & Footer</TabsTrigger>
                        </TabsList>

                        <TabsContent value="ordering" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Section Ordering & Visibility</CardTitle>
                                    <CardDescription>Drag to reorder sections and toggle their visibility on the public page.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <ReactSortable
                                            list={config.sectionOrder}
                                            setList={handleSortChange}
                                            animation={200}
                                            handle=".drag-handle"
                                            className="space-y-3"
                                        >
                                            {config.sectionOrder.map((section: any, idx: number) => (
                                                <div key={section.id || idx} className="flex items-center justify-between p-3 bg-white dark:bg-black border rounded shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-muted-foreground shrink-0">
                                                            <IconGripVertical size={18} />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{section.name}</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border rounded text-muted-foreground font-mono">#{section.id}</span>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={section.enabled}
                                                        onCheckedChange={(checked) => {
                                                            setConfig((prev: any) => {
                                                                const newOrder = [...prev.sectionOrder];
                                                                const targetIdx = newOrder.findIndex(s => s.id === section.id);
                                                                if (targetIdx > -1) {
                                                                    newOrder[targetIdx] = { ...newOrder[targetIdx], enabled: checked };
                                                                }
                                                                return {
                                                                    ...prev,
                                                                    sectionOrder: newOrder,
                                                                    [section.id]: {
                                                                        ...prev[section.id],
                                                                        enabled: checked
                                                                    }
                                                                };
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </ReactSortable>
                                        <p className="text-xs text-muted-foreground mt-4 italic">* Tip: Drag the <IconGripVertical className="inline h-3 w-3" /> handle to reorder sections. Changes apply immediately to the page flow.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="header_footer" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                                    <div>
                                        <CardTitle>Header Settings</CardTitle>
                                        <CardDescription>Configure the navigation bar of the landing page.</CardDescription>
                                    </div>
                                    <Switch checked={config.header.enabled} onCheckedChange={v => handleChange('header', 'enabled', v)} />
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Header Style</Label>
                                        <Select value={config.header.style} onValueChange={v => handleChange('header', 'style', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="transparent">Transparent Overlay</SelectItem>
                                                <SelectItem value="solid">Solid Background</SelectItem>
                                                <SelectItem value="floating">Floating Pill</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Button Style</Label>
                                        <Select value={config.header.buttonStyle} onValueChange={v => handleChange('header', 'buttonStyle', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="solid">Solid Background</SelectItem>
                                                <SelectItem value="outline">Outline</SelectItem>
                                                <SelectItem value="ghost">Ghost text</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Background Color</Label>
                                        <div className="flex gap-2">
                                            <Input type="color" className="w-12 h-10 p-1" value={config.header.bgColor} onChange={e => handleChange('header', 'bgColor', e.target.value)} />
                                            <Input type="text" className="flex-1" value={config.header.bgColor} onChange={e => handleChange('header', 'bgColor', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Text Color</Label>
                                        <div className="flex gap-2">
                                            <Input type="color" className="w-12 h-10 p-1" value={config.header.textColor} onChange={e => handleChange('header', 'textColor', e.target.value)} />
                                            <Input type="text" className="flex-1" value={config.header.textColor} onChange={e => handleChange('header', 'textColor', e.target.value)} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="mt-6">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                                    <div>
                                        <CardTitle>Header Navigation Menu</CardTitle>
                                        <CardDescription>Manage the links shown in the top navigation bar.</CardDescription>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => addArrayItem('header', 'menuItems', { name: 'New Link', link: '#', enabled: true })}>
                                        <IconPlus className="h-4 w-4 mr-1" /> Add Menu Item
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {config.header.menuItems?.map((item: any, i: number) => (
                                            <div key={i} className="flex flex-col sm:flex-row gap-3 items-start bg-gray-50 dark:bg-gray-800 p-3 border rounded-lg group">
                                                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Menu Name</Label>
                                                        <Input placeholder="e.g. Features" value={item.name} onChange={e => handleArrayChange('header', 'menuItems', i, 'name', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Section Link / URL</Label>
                                                        <Input placeholder="e.g. #features" value={item.link} onChange={e => handleArrayChange('header', 'menuItems', i, 'link', e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 sm:pt-6">
                                                    <div className="flex items-center space-x-2 mr-2">
                                                        <Switch checked={item.enabled} onCheckedChange={v => handleArrayChange('header', 'menuItems', i, 'enabled', v)} />
                                                        <Label className="text-xs">Enabled</Label>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeArrayItem('header', 'menuItems', i)}>
                                                        <IconTrash size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!config.header.menuItems || config.header.menuItems.length === 0) && (
                                            <p className="text-sm text-muted-foreground text-center py-4">No menu items defined.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>


                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                                    <div>
                                        <CardTitle>Footer Area</CardTitle>
                                    </div>
                                    <Switch checked={config.footer.enabled} onCheckedChange={v => handleChange('footer', 'enabled', v)} />
                                </CardHeader>
                                <CardContent className="space-y-6 mt-4">
                                    <div className="space-y-2">
                                        <Label>Footer Copy / Description</Label>
                                        <Textarea value={config.footer.description} onChange={e => handleChange('footer', 'description', e.target.value)} placeholder="Company mission or generic footer copy" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Copyright Content</Label>
                                        <Input value={config.footer.content} onChange={e => handleChange('footer', 'content', e.target.value)} placeholder="© 2026 Acme. All rights reserved." />
                                    </div>

                                    <div className="border border-dashed p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label className="text-base font-semibold">Social Links</Label>
                                            <Button size="sm" variant="outline" onClick={() => addArrayItem('footer', 'socialLinks', { name: 'Twitter', icon: 'twitter', url: '#' })}>
                                                <IconPlus className="h-4 w-4 mr-1" /> Add Social
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {config.footer.socialLinks.map((link: any, i: number) => (
                                                <div key={i} className="flex gap-3 items-center">
                                                    <div className="w-1/3">
                                                        <Input placeholder="Name (e.g. Facebook)" value={link.name} onChange={e => handleArrayChange('footer', 'socialLinks', i, 'name', e.target.value)} />
                                                    </div>
                                                    <div className="w-1/3">
                                                        <IconPicker value={link.icon} onChange={val => handleArrayChange('footer', 'socialLinks', i, 'icon', val)} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Input placeholder="URL" value={link.url} onChange={e => handleArrayChange('footer', 'socialLinks', i, 'url', e.target.value)} />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => removeArrayItem('footer', 'socialLinks', i)}><IconTrash size={16} /></Button>
                                                </div>
                                            ))}
                                            {config.footer.socialLinks.length === 0 && <p className="text-sm text-muted-foreground">No social links added.</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* --- 3. CONTENT TAB --- */}
                <TabsContent value="content" className="space-y-6 mt-6 focus-visible:outline-none">
                    <Tabs defaultValue="hero" className="w-full">
                        <TabsList className="flex w-fit bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-none p-0 h-auto mb-6 gap-6">
                            <TabsTrigger value="hero" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2 px-1 text-sm font-medium transition-none">Hero Section</TabsTrigger>
                            <TabsTrigger value="features" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2 px-1 text-sm font-medium transition-none">Features & Why Us</TabsTrigger>
                            <TabsTrigger value="gallery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2 px-1 text-sm font-medium transition-none">Gallery & About</TabsTrigger>
                        </TabsList>

                        <TabsContent value="hero" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                                    <div>
                                        <CardTitle>Hero Configuration</CardTitle>
                                        <CardDescription>The main banner at the top of the page.</CardDescription>
                                    </div>
                                    <Switch checked={config.hero.enabled} onCheckedChange={v => handleChange('hero', 'enabled', v)} />
                                </CardHeader>
                                <CardContent className="space-y-6 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Layout Style</Label>
                                            <Select value={config.hero.layout} onValueChange={v => handleChange('hero', 'layout', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="contentLeft">Content Left / Image Right</SelectItem>
                                                    <SelectItem value="contentRight">Content Right / Image Left</SelectItem>
                                                    <SelectItem value="fullWidth">Full Width Centered</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Section Height</Label>
                                            <Input value={config.hero.height} onChange={e => handleChange('hero', 'height', e.target.value)} placeholder="e.g. 100vh or 800px" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Announcement Badge</Label>
                                            <Input value={config.hero.badge} onChange={e => handleChange('hero', 'badge', e.target.value)} placeholder="New: Feature X is live!" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label>Hero Title</Label>
                                            <Input value={config.hero.title} onChange={e => handleChange('hero', 'title', e.target.value)} placeholder="Your catchy headline" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hero Subtitle</Label>
                                            <Textarea value={config.hero.subtitle} onChange={e => handleChange('hero', 'subtitle', e.target.value)} placeholder="Detailed explanation" rows={3} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-bold">Primary Button</Label>
                                                <Switch checked={config.hero.primaryBtnEnabled} onCheckedChange={v => handleChange('hero', 'primaryBtnEnabled', v)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Text</Label>
                                                <Input value={config.hero.primaryBtnText} onChange={e => handleChange('hero', 'primaryBtnText', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Link URL</Label>
                                                <Input value={config.hero.primaryBtnLink} onChange={e => handleChange('hero', 'primaryBtnLink', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-bold">Secondary Button</Label>
                                                <Switch checked={config.hero.secondaryBtnEnabled} onCheckedChange={v => handleChange('hero', 'secondaryBtnEnabled', v)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Text</Label>
                                                <Input value={config.hero.secondaryBtnText} onChange={e => handleChange('hero', 'secondaryBtnText', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Link URL</Label>
                                                <Input value={config.hero.secondaryBtnLink} onChange={e => handleChange('hero', 'secondaryBtnLink', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Hero Image Upload/URL</Label>
                                            <div className="flex gap-2">
                                                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => handleChange('hero', 'imageUrl', url))} className="w-32 flex-none" />
                                                <Input value={config.hero.imageUrl} onChange={e => handleChange('hero', 'imageUrl', e.target.value)} placeholder="https://..." className="flex-1" />
                                            </div>
                                            {config.hero.imageUrl && <div className="mt-2 text-xs text-green-600 truncate">{config.hero.imageUrl}</div>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Image Position/Role</Label>
                                            <Select value={config.hero.imagePos} onValueChange={v => handleChange('hero', 'imagePos', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="right">Side Right</SelectItem>
                                                    <SelectItem value="left">Side Left</SelectItem>
                                                    <SelectItem value="center">Center Bottom</SelectItem>
                                                    <SelectItem value="background">Background Image</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="space-y-2">
                                            <Label>Background Color</Label>
                                            <div className="flex gap-2">
                                                <Input type="color" className="w-12 h-10 p-1" value={config.hero.bgColor} onChange={e => handleChange('hero', 'bgColor', e.target.value)} />
                                                <Input type="text" className="flex-1" value={config.hero.bgColor} onChange={e => handleChange('hero', 'bgColor', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label>Dark Overlay</Label>
                                                <Switch checked={config.hero.bgOverlay} onCheckedChange={v => handleChange('hero', 'bgOverlay', v)} />
                                            </div>
                                            <Input type="text" placeholder="rgba(0,0,0,0.5)" value={config.hero.overlayColor} onChange={e => handleChange('hero', 'overlayColor', e.target.value)} disabled={!config.hero.bgOverlay} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Text Color</Label>
                                            <div className="flex gap-2">
                                                <Input type="color" className="w-12 h-10 p-1" value={config.hero.textColor} onChange={e => handleChange('hero', 'textColor', e.target.value)} />
                                                <Input type="text" className="flex-1" value={config.hero.textColor} onChange={e => handleChange('hero', 'textColor', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="features" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                                    <div><CardTitle>Features Section</CardTitle></div>
                                    <Switch checked={config.features.enabled} onCheckedChange={v => handleChange('features', 'enabled', v)} />
                                </CardHeader>
                                <CardContent className="space-y-6 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Layout Style</Label>
                                            <Select value={config.features.layout} onValueChange={v => handleChange('features', 'layout', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="grid">Grid Layout</SelectItem>
                                                    <SelectItem value="list">List View</SelectItem>
                                                    <SelectItem value="alternating">Alternating Images</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Cards per Column</Label>
                                            <Select value={config.features.columns} onValueChange={v => handleChange('features', 'columns', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 Column</SelectItem>
                                                    <SelectItem value="2">2 Columns</SelectItem>
                                                    <SelectItem value="3">3 Columns</SelectItem>
                                                    <SelectItem value="4">4 Columns</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 flex items-center justify-center pt-6">
                                            <div className="flex items-center space-x-2">
                                                <Switch id="feature-icons" checked={config.features.displayIcon} onCheckedChange={v => handleChange('features', 'displayIcon', v)} />
                                                <Label htmlFor="feature-icons">Display Feature Icons</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Section Title</Label>
                                            <Input value={config.features.title} onChange={e => handleChange('features', 'title', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Section Description</Label>
                                            <Textarea value={config.features.description} onChange={e => handleChange('features', 'description', e.target.value)} rows={1} />
                                        </div>
                                    </div>

                                    <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label className="text-base font-semibold">Feature Boxes</Label>
                                            <Button size="sm" onClick={() => addArrayItem('features', 'boxes', { title: 'New Feature', icon: 'star', description: 'Description here.' })}>
                                                <IconPlus className="h-4 w-4 mr-1" /> Add Feature
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {config.features.boxes.map((box: any, i: number) => (
                                                <div key={i} className="flex flex-col sm:flex-row gap-3 items-start bg-white dark:bg-black p-3 border rounded">
                                                    <div className="flex-1 w-full space-y-3">
                                                        <div className="flex gap-3">
                                                            <Input placeholder="Title" value={box.title} onChange={e => handleArrayChange('features', 'boxes', i, 'title', e.target.value)} />
                                                            <div className="w-48 shrink-0">
                                                                <IconPicker value={box.icon} onChange={val => handleArrayChange('features', 'boxes', i, 'icon', val)} />
                                                            </div>
                                                        </div>
                                                        <Textarea placeholder="Details..." rows={2} value={box.description} onChange={e => handleArrayChange('features', 'boxes', i, 'description', e.target.value)} />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-500 shrink-0 mt-1" onClick={() => removeArrayItem('features', 'boxes', i)}><IconTrash size={16} /></Button>
                                                </div>
                                            ))}
                                            {config.features.boxes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No features defined.</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                                    <div><CardTitle>Why Us Section</CardTitle></div>
                                    <Switch checked={config.whyUs.enabled} onCheckedChange={v => handleChange('whyUs', 'enabled', v)} />
                                </CardHeader>
                                <CardContent className="space-y-6 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Section Title</Label>
                                            <Input value={config.whyUs.title} onChange={e => handleChange('whyUs', 'title', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Section Subtitle</Label>
                                            <Input value={config.whyUs.subtitle} onChange={e => handleChange('whyUs', 'subtitle', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label className="text-base font-semibold">Key Reasons</Label>
                                            <Button size="sm" onClick={() => addArrayItem('whyUs', 'reasons', { title: 'Reason Title', icon: 'Check', description: 'Description here.' })}>
                                                <IconPlus className="h-4 w-4 mr-1" /> Add Reason
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {config.whyUs.reasons.map((reason: any, i: number) => (
                                                <div key={i} className="flex flex-col sm:flex-row gap-3 items-start bg-white dark:bg-black p-3 border rounded">
                                                    <div className="flex-1 w-full space-y-3">
                                                        <div className="flex gap-3">
                                                            <Input placeholder="Reason Title" value={reason.title} onChange={e => handleArrayChange('whyUs', 'reasons', i, 'title', e.target.value)} />
                                                            <div className="w-48 shrink-0">
                                                                <IconPicker value={reason.icon} onChange={val => handleArrayChange('whyUs', 'reasons', i, 'icon', val)} />
                                                            </div>
                                                        </div>
                                                        <Textarea placeholder="Description..." rows={2} value={reason.description} onChange={e => handleArrayChange('whyUs', 'reasons', i, 'description', e.target.value)} />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-500 shrink-0 mt-1" onClick={() => removeArrayItem('whyUs', 'reasons', i)}><IconTrash size={16} /></Button>
                                                </div>
                                            ))}
                                            {config.whyUs.reasons.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No reasons defined.</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="gallery" className="space-y-6 focus-visible:outline-none">

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                                    <div><CardTitle>Platform Overview</CardTitle></div>
                                    <Switch checked={config.screenshots.enabled} onCheckedChange={v => handleChange('screenshots', 'enabled', v)} />
                                </CardHeader>
                                <CardContent className="space-y-4 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input value={config.screenshots.title} onChange={e => handleChange('screenshots', 'title', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Subtitle</Label>
                                            <Input value={config.screenshots.subtitle} onChange={e => handleChange('screenshots', 'subtitle', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label className="text-base font-semibold">Gallery Images</Label>
                                            <Button size="sm" onClick={() => addArrayItem('screenshots', 'gallery', { url: '', title: '', altText: '', description: '' })}>
                                                <IconPlus className="h-4 w-4 mr-1" /> Add Image
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {config.screenshots.gallery.map((img: any, i: number) => (
                                                <div key={i} className="flex flex-col sm:flex-row gap-4 items-start bg-white dark:bg-black p-4 border rounded">
                                                    <div className="w-full sm:w-1/3 flex flex-col gap-2">
                                                        {img.url ? (
                                                            <div className="h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                                                <img src={img.url} alt="preview" className="max-h-full max-w-full object-contain" />
                                                            </div>
                                                        ) : (
                                                            <div className="h-32 border-2 border-dashed rounded flex flex-col items-center justify-center text-gray-400 p-2 text-center text-xs">
                                                                <Input type="file" onChange={(e) => handleImageUpload(e, (url) => handleArrayChange('screenshots', 'gallery', i, 'url', url))} className="max-w-[150px]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 w-full space-y-3">
                                                        <div className="flex gap-3">
                                                            <Input placeholder="Image Title (optional)" value={img.title} onChange={e => handleArrayChange('screenshots', 'gallery', i, 'title', e.target.value)} />
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Input placeholder="URL override" value={img.url} onChange={e => handleArrayChange('screenshots', 'gallery', i, 'url', e.target.value)} className="font-mono text-xs" />
                                                            <Input placeholder="Alt Text" value={img.altText} onChange={e => handleArrayChange('screenshots', 'gallery', i, 'altText', e.target.value)} />
                                                        </div>
                                                        <Textarea placeholder="Caption/Description..." rows={2} value={img.description} onChange={e => handleArrayChange('screenshots', 'gallery', i, 'description', e.target.value)} />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => removeArrayItem('screenshots', 'gallery', i)}><IconTrash size={16} /></Button>
                                                </div>
                                            ))}
                                            {config.screenshots.gallery.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No images added.</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                                    <div><CardTitle>About Section</CardTitle></div>
                                    <Switch checked={config.about.enabled} onCheckedChange={v => handleChange('about', 'enabled', v)} />
                                </CardHeader>
                                <CardContent className="space-y-4 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Layout Style</Label>
                                            <Select value={config.about.layout} onValueChange={v => handleChange('about', 'layout', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="contentLeft">Content Left / Image Right</SelectItem>
                                                    <SelectItem value="contentRight">Content Right / Image Left</SelectItem>
                                                    <SelectItem value="center">Center Centered</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2 pt-8">
                                                <Switch id="parallax" checked={config.about.parallax} onCheckedChange={v => handleChange('about', 'parallax', v)} />
                                                <Label htmlFor="parallax">Enable Parallax Effect for Background Image</Label>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input value={config.about.title} onChange={e => handleChange('about', 'title', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>About Image / Background Upload</Label>
                                            <div className="flex gap-2">
                                                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => handleChange('about', 'imageUrl', url))} />
                                                <Input value={config.about.imageUrl} onChange={e => handleChange('about', 'imageUrl', e.target.value)} placeholder="URL..." className="w-1/3 text-xs" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Main Description</Label>
                                            <Textarea value={config.about.description} onChange={e => handleChange('about', 'description', e.target.value)} rows={3} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>


                {/* --- 4. SOCIAL TAB --- */}
                <TabsContent value="social" className="space-y-6 mt-6 focus-visible:outline-none">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                            <div><CardTitle>Testimonials / Reviews</CardTitle></div>
                            <Switch checked={config.reviews.enabled} onCheckedChange={v => handleChange('reviews', 'enabled', v)} />
                        </CardHeader>
                        <CardContent className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <Label>Section Title</Label>
                                    <Input value={config.reviews.title} onChange={e => handleChange('reviews', 'title', e.target.value)} placeholder="What our clients say" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Section Subtitle</Label>
                                    <Input value={config.reviews.subtitle} onChange={e => handleChange('reviews', 'subtitle', e.target.value)} />
                                </div>
                            </div>

                            <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-4">
                                    <Label className="text-base font-semibold">Testimonials</Label>
                                    <Button size="sm" onClick={() => addArrayItem('reviews', 'testimonials', { name: '', role: '', company: '', rating: 5, content: '' })}>
                                        <IconPlus className="h-4 w-4 mr-1" /> Add Review
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {config.reviews.testimonials.map((testi: any, i: number) => (
                                        <div key={i} className="flex gap-3 items-start bg-white dark:bg-black p-4 border rounded relative group">
                                            <div className="flex-1 w-full space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input placeholder="Person Name" value={testi.name} onChange={e => handleArrayChange('reviews', 'testimonials', i, 'name', e.target.value)} />
                                                    <Input placeholder="Role (e.g. CEO)" value={testi.role} onChange={e => handleArrayChange('reviews', 'testimonials', i, 'role', e.target.value)} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input placeholder="Company" value={testi.company} onChange={e => handleArrayChange('reviews', 'testimonials', i, 'company', e.target.value)} />
                                                    <Input type="number" min="1" max="5" placeholder="Rating (1-5)" value={testi.rating} onChange={e => handleArrayChange('reviews', 'testimonials', i, 'rating', Number(e.target.value))} />
                                                </div>
                                                <Textarea placeholder="Testimonial content..." rows={3} value={testi.content} onChange={e => handleArrayChange('reviews', 'testimonials', i, 'content', e.target.value)} />
                                            </div>
                                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition" onClick={() => removeArrayItem('reviews', 'testimonials', i)}>
                                                <IconTrash size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                    {config.reviews.testimonials.length === 0 && <p className="text-sm text-muted-foreground w-full col-span-2 text-center py-4">No testimonials added.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing Plans Note</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                The Pricing section on the public landing page is populated automatically from the Plans configured in <strong>Plan Settings</strong>. Navigation to <code>/admin/plans</code> to configure pricing displays.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- 5. ENGAGEMENT TAB --- */}
                <TabsContent value="engagement" className="space-y-6 mt-6 focus-visible:outline-none">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                            <div><CardTitle>FAQ Section</CardTitle></div>
                            <Switch checked={config.faq.enabled} onCheckedChange={v => handleChange('faq', 'enabled', v)} />
                        </CardHeader>
                        <CardContent className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>FAQ Title</Label>
                                    <Input value={config.faq.title} onChange={e => handleChange('faq', 'title', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>FAQ Subtitle</Label>
                                    <Input value={config.faq.subtitle} onChange={e => handleChange('faq', 'subtitle', e.target.value)} />
                                </div>
                            </div>
                            <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-4">
                                    <Label className="text-base font-semibold">Q&A Items</Label>
                                    <Button size="sm" onClick={() => addArrayItem('faq', 'items', { question: '', answer: '' })}>
                                        <IconPlus className="h-4 w-4 mr-1" /> Add FAQ
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {config.faq.items.map((item: any, i: number) => (
                                        <div key={i} className="flex gap-4 items-start bg-white dark:bg-black p-4 border rounded">
                                            <div className="flex-1 w-full space-y-3">
                                                <Input placeholder="Question?" value={item.question} onChange={e => handleArrayChange('faq', 'items', i, 'question', e.target.value)} className="font-semibold" />
                                                <Textarea placeholder="Answer..." rows={2} value={item.answer} onChange={e => handleArrayChange('faq', 'items', i, 'answer', e.target.value)} />
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => removeArrayItem('faq', 'items', i)}><IconTrash size={16} /></Button>
                                        </div>
                                    ))}
                                    {config.faq.items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No FAQs added.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0.5 pb-2">
                            <div><CardTitle>Contact Form Section</CardTitle></div>
                            <Switch checked={config.contact.enabled} onCheckedChange={v => handleChange('contact', 'enabled', v)} />
                        </CardHeader>
                        <CardContent className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={config.contact.title} onChange={e => handleChange('contact', 'title', e.target.value)} placeholder="Get in touch" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <Input value={config.contact.subtitle} onChange={e => handleChange('contact', 'subtitle', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Form Title</Label>
                                    <Input value={config.contact.formTitle} onChange={e => handleChange('contact', 'formTitle', e.target.value)} placeholder="Send us a message" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Info Panel Title</Label>
                                    <Input value={config.contact.infoTitle} onChange={e => handleChange('contact', 'infoTitle', e.target.value)} placeholder="Contact Information" />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">Note: The contact details (Email, Phone, Address, Map) displayed next to the form are pulled from the <strong>Set Up &gt; Company Information</strong> tab.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs >
            <Toaster position="top-center" />
        </div >
    );
};

export default LandingPageBuilder;
