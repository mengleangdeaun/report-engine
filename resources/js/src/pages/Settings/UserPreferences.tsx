import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { setUserPreferences } from '@/store/themeConfigSlice';
import api from '@/utils/api';
import { toast, Toaster } from 'react-hot-toast';
import {
    IconSettings, IconPalette, IconClock, IconBell, IconShieldCheck,
    IconDeviceFloppy, IconTypography, IconCalendar, IconClockHour4,
    IconCookie, IconLoader2, IconDroplet, IconCheck, IconSun, IconMoon, IconDeviceDesktop
} from '@tabler/icons-react';
import { toggleTheme } from '@/store/themeConfigSlice';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

/* ─────────────────────────────────────────────────────────
   Options
───────────────────────────────────────────────────────── */
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

const DATE_FORMATS = [
    { label: 'Dec 31, 2024', format: 'MMM DD, YYYY', value: 'MMM DD, YYYY' },
    { label: '31 Dec 2024', format: 'DD MMM YYYY', value: 'DD MMM YYYY' },
    { label: '2024-12-31', format: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
    { label: '12/31/2024', format: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: '31/12/2024', format: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'December 31, 2024', format: 'MMMM DD, YYYY', value: 'MMMM DD, YYYY' },
    { label: '31 December 2024', format: 'DD MMMM YYYY', value: 'DD MMMM YYYY' },
];

const TIME_FORMATS = [
    { label: '12-Hour', example: '1:30 PM', value: '12h' },
    { label: '24-Hour', example: '13:30', value: '24h' },
];

const THEME_COLORS = [
    { label: 'Blue', value: 'blue', hex: '#0284c7', primary: '198 100% 39%', secondary: '198 40% 94%', accent: '198 50% 90%', ring: '198 100% 39%', darkPrimary: '198 100% 45%', darkSecondary: '198 30% 18%', darkAccent: '198 35% 20%', darkRing: '198 100% 45%' },
    { label: 'Sky', value: 'sky', hex: '#0ea5e9', primary: '199 89% 48%', secondary: '199 40% 94%', accent: '199 50% 90%', ring: '199 89% 48%', darkPrimary: '199 89% 52%', darkSecondary: '199 30% 18%', darkAccent: '199 35% 20%', darkRing: '199 89% 52%' },
    { label: 'Indigo', value: 'indigo', hex: '#6366f1', primary: '239 84% 67%', secondary: '239 40% 94%', accent: '239 50% 92%', ring: '239 84% 67%', darkPrimary: '239 84% 67%', darkSecondary: '239 30% 18%', darkAccent: '239 35% 20%', darkRing: '239 84% 67%' },
    { label: 'Violet', value: 'violet', hex: '#8b5cf6', primary: '263 70% 66%', secondary: '263 40% 94%', accent: '263 50% 92%', ring: '263 70% 66%', darkPrimary: '263 70% 66%', darkSecondary: '263 30% 18%', darkAccent: '263 35% 20%', darkRing: '263 70% 66%' },
    { label: 'Fuchsia', value: 'fuchsia', hex: '#d946ef', primary: '292 84% 61%', secondary: '292 40% 94%', accent: '292 50% 92%', ring: '292 84% 61%', darkPrimary: '292 84% 61%', darkSecondary: '292 30% 18%', darkAccent: '292 35% 20%', darkRing: '292 84% 61%' },
    { label: 'Pink', value: 'pink', hex: '#ec4899', primary: '330 81% 60%', secondary: '330 40% 94%', accent: '330 50% 92%', ring: '330 81% 60%', darkPrimary: '330 81% 60%', darkSecondary: '330 30% 18%', darkAccent: '330 35% 20%', darkRing: '330 81% 60%' },
    { label: 'Rose', value: 'rose', hex: '#f43f5e', primary: '347 77% 60%', secondary: '347 40% 94%', accent: '347 50% 92%', ring: '347 77% 60%', darkPrimary: '347 77% 60%', darkSecondary: '347 30% 18%', darkAccent: '347 35% 20%', darkRing: '347 77% 60%' },
    { label: 'Red', value: 'red', hex: '#ef4444', primary: '0 72% 51%', secondary: '0 40% 94%', accent: '0 50% 92%', ring: '0 72% 51%', darkPrimary: '0 72% 55%', darkSecondary: '0 30% 18%', darkAccent: '0 35% 20%', darkRing: '0 72% 55%' },
    { label: 'Orange', value: 'orange', hex: '#f97316', primary: '25 95% 53%', secondary: '25 40% 94%', accent: '25 50% 90%', ring: '25 95% 53%', darkPrimary: '25 95% 53%', darkSecondary: '25 30% 18%', darkAccent: '25 35% 20%', darkRing: '25 95% 53%' },
    { label: 'Amber', value: 'amber', hex: '#f59e0b', primary: '38 92% 50%', secondary: '38 40% 94%', accent: '38 50% 90%', ring: '38 92% 50%', darkPrimary: '38 92% 50%', darkSecondary: '38 30% 18%', darkAccent: '38 35% 20%', darkRing: '38 92% 50%' },
    { label: 'Lime', value: 'lime', hex: '#84cc16', primary: '84 81% 44%', secondary: '84 40% 94%', accent: '84 50% 90%', ring: '84 81% 44%', darkPrimary: '84 81% 50%', darkSecondary: '84 30% 18%', darkAccent: '84 35% 20%', darkRing: '84 81% 50%' },
    { label: 'Emerald', value: 'emerald', hex: '#10b981', primary: '160 84% 39%', secondary: '160 40% 94%', accent: '160 50% 90%', ring: '160 84% 39%', darkPrimary: '160 84% 45%', darkSecondary: '160 30% 18%', darkAccent: '160 35% 20%', darkRing: '160 84% 45%' },
    { label: 'Teal', value: 'teal', hex: '#14b8a6', primary: '174 72% 40%', secondary: '174 40% 94%', accent: '174 50% 90%', ring: '174 72% 40%', darkPrimary: '174 72% 46%', darkSecondary: '174 30% 18%', darkAccent: '174 35% 20%', darkRing: '174 72% 46%' },
    { label: 'Cyan', value: 'cyan', hex: '#06b6d4', primary: '189 94% 43%', secondary: '189 40% 94%', accent: '189 50% 90%', ring: '189 94% 43%', darkPrimary: '189 94% 48%', darkSecondary: '189 30% 18%', darkAccent: '189 35% 20%', darkRing: '189 94% 48%' },
    { label: 'Slate', value: 'slate', hex: '#64748b', primary: '215 16% 47%', secondary: '215 20% 94%', accent: '215 25% 90%', ring: '215 16% 47%', darkPrimary: '215 20% 55%', darkSecondary: '215 15% 18%', darkAccent: '215 18% 20%', darkRing: '215 20% 55%' },
];

/* ─────────────────────────────────────────────────────────
   Section Card
───────────────────────────────────────────────────────── */
const SectionCard = ({
    icon, iconColor, title, description, children, badge
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    description?: string;
    children: React.ReactNode;
    badge?: string;
}) => (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        {badge && <Badge variant="outline" className="text-[10px] px-2 py-0">{badge}</Badge>}
                    </div>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                </div>
            </div>
        </div>
        <div className="px-6 py-5 space-y-5">
            {children}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Setting Row
───────────────────────────────────────────────────────── */
const SettingRow = ({
    icon, label, description, children
}: {
    icon?: React.ReactNode;
    label: string;
    description?: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-0">{label}</Label>
            </div>
            {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-7">{description}</p>}
        </div>
        <div className="sm:w-64 shrink-0">
            {children}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */
export default function UserPreferences() {
    const dispatch = useDispatch();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [saving, setSaving] = useState(false);

    const [preferences, setPreferences] = useState({
        font_family: themeConfig.fontFamily || 'Nunito',
        date_format: themeConfig.dateFormat || 'MMM DD, YYYY',
        time_format: themeConfig.timeFormat || '12h',
        notifications_enabled: themeConfig.notificationsEnabled,
        cookie_consent: themeConfig.cookieConsent || 'pending',
        accent_color: localStorage.getItem('accentColor') || 'blue',
    });

    // Apply accent color CSS variables
    const applyAccentColor = (colorValue: string) => {
        const color = THEME_COLORS.find(c => c.value === colorValue);
        if (!color) return;
        const isDark = document.body.classList.contains('dark');
        const targets = [document.documentElement, document.body];
        targets.forEach(el => {
            el.style.setProperty('--primary', isDark ? color.darkPrimary : color.primary);
            el.style.setProperty('--primary-foreground', '0 0% 100%');
            el.style.setProperty('--secondary', isDark ? color.darkSecondary : color.secondary);
            el.style.setProperty('--accent', isDark ? color.darkAccent : color.accent);
            el.style.setProperty('--ring', isDark ? color.darkRing : color.ring);
        });
        localStorage.setItem('accentColor', colorValue);
    };

    useEffect(() => {
        applyAccentColor(preferences.accent_color);
    }, [preferences.accent_color, themeConfig.theme]);

    const handleChange = (key: string, value: any) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/user/preferences', { preferences });
            dispatch(setUserPreferences(res.data.preferences));
            toast.success('Preferences saved successfully!');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            toast.error('Could not save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const currentFont = FONTS.find(f => f.value === preferences.font_family);
    const currentDate = DATE_FORMATS.find(f => f.value === preferences.date_format);
    const currentTime = TIME_FORMATS.find(f => f.value === preferences.time_format);

    return (
        <div className="mx-auto">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2.5 text-gray-900 dark:text-gray-50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            <IconSettings size={22} />
                        </div>
                        User Preferences
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 ml-[52px]">
                        Customize your Report Engine experience.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 h-10"
                >
                    {saving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="space-y-6">

                {/* ── Theme & Colors ── */}
                <SectionCard
                    icon={<IconDroplet size={18} className="text-sky-600 dark:text-sky-400" />}
                    iconColor="bg-sky-100 dark:bg-sky-900/40"
                    title="Theme & Colors"
                    description="Choose your preferred appearance mode and accent color"
                >
                    {/* Dark / Light / System */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-3">Appearance</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'light', label: 'Light', icon: <IconSun size={18} /> },
                                { value: 'dark', label: 'Dark', icon: <IconMoon size={18} /> },
                                { value: 'system', label: 'System', icon: <IconDeviceDesktop size={18} /> },
                            ].map(mode => (
                                <button
                                    key={mode.value}
                                    onClick={() => dispatch(toggleTheme(mode.value))}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${themeConfig.theme === mode.value
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {mode.icon}
                                    <span className="text-xs font-medium">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator className="dark:bg-gray-800" />

                    {/* Accent Color Picker */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-1">Accent Color</Label>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Sets the primary color for buttons, links, and highlights</p>
                        <div className="flex flex-wrap gap-3">
                            {THEME_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => {
                                        handleChange('accent_color', color.value);
                                        applyAccentColor(color.value);
                                    }}
                                    className="group relative flex flex-col items-center gap-1.5"
                                    title={color.label}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center ${preferences.accent_color === color.value
                                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                                            : 'hover:scale-105'
                                            }`}
                                        style={{
                                            backgroundColor: color.hex,
                                            boxShadow: preferences.accent_color === color.value ? `0 4px 12px ${color.hex}40` : undefined,
                                        }}
                                    >
                                        {preferences.accent_color === color.value && (
                                            <IconCheck size={16} className="text-white drop-shadow-sm" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-medium ${preferences.accent_color === color.value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                                        }`}>{color.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </SectionCard>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 justify-between' >
                    {/* ── Display & Typography ── */}
                    <SectionCard
                        icon={<IconPalette size={18} className="text-purple-600 dark:text-purple-400" />}
                        iconColor="bg-purple-100 dark:bg-purple-900/40"
                        title="Display & Typography"
                        description="Control the look and feel of the interface"
                    >
                        <SettingRow
                            icon={<IconTypography size={16} />}
                            label="Interface Font"
                            description="Applied to all text across the application"
                        >
                            <Select value={preferences.font_family} onValueChange={(v) => handleChange('font_family', v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONTS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <span style={{ fontFamily: f.value }}>{f.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SettingRow>

                        {/* Font Preview */}
                        {currentFont && (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
                                <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 font-semibold">Preview</p>
                                <p className="text-lg text-gray-800 dark:text-gray-200" style={{ fontFamily: currentFont.value }}>
                                    The quick brown fox jumps over the lazy dog.
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: currentFont.value }}>
                                    0123456789 — $1,234.56 — 98.7%
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Localization ── */}
                    <SectionCard
                        icon={<IconClock size={18} className="text-blue-600 dark:text-blue-400" />}
                        iconColor="bg-blue-100 dark:bg-blue-900/40"
                        title="Date & Time Formats"
                        description="How dates and times appear in reports and tables"
                    >
                        <SettingRow
                            icon={<IconCalendar size={16} />}
                            label="Date Format"
                            description="Used for dates like reporting periods and last edited"
                        >
                            <Select value={preferences.date_format} onValueChange={(v) => handleChange('date_format', v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_FORMATS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <div className="flex items-center justify-between w-full gap-3">
                                                <span>{f.label}</span>
                                                <span className="text-[11px] text-gray-400 font-mono">{f.format}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SettingRow>

                        <Separator className="dark:bg-gray-800" />

                        <SettingRow
                            icon={<IconClockHour4 size={16} />}
                            label="Time Format"
                            description="Choose between 12-hour and 24-hour clock"
                        >
                            <Select value={preferences.time_format} onValueChange={(v) => handleChange('time_format', v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_FORMATS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <div className="flex items-center gap-2">
                                                <span>{f.label}</span>
                                                <span className="text-[11px] text-gray-400">({f.example})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SettingRow>

                        {/* Inline preview */}
                        <div className="ml-7 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">Preview:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {currentDate?.label || '—'} {currentTime?.value === '24h' ? '13:30' : '1:30 PM'}
                            </span>
                        </div>
                    </SectionCard>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 justify-between' >
                    {/* ── Notifications ── */}
                    <SectionCard
                        icon={<IconBell size={18} className="text-orange-600 dark:text-orange-400" />}
                        iconColor="bg-orange-100 dark:bg-orange-900/40"
                        title="Notifications"
                        description="Manage how you receive updates"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-0">Web Notifications</Label>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Receive in-app notifications for report completions and system alerts.
                                </p>
                            </div>
                            <Switch
                                checked={preferences.notifications_enabled}
                                onCheckedChange={(checked) => handleChange('notifications_enabled', checked)}
                            />
                        </div>

                        <Separator className="dark:bg-gray-800" />

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/40">
                            <span className="text-blue-500 dark:text-blue-400 shrink-0">💬</span>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                For Telegram notifications, configure your integration in{' '}
                                <a href="/apps/settings/telegram" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                    Telegram Settings
                                </a>.
                            </p>
                        </div>
                    </SectionCard>

                    {/* ── Privacy & Consent ── */}
                    <SectionCard
                        icon={<IconShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />}
                        iconColor="bg-emerald-100 dark:bg-emerald-900/40"
                        title="Privacy & Consent"
                        description="Control data handling and cookie preferences"
                    >
                        <SettingRow
                            icon={<IconCookie size={16} />}
                            label="Cookie Usage"
                            description="Controls which cookies are stored by the application"
                        >
                            <Select value={preferences.cookie_consent} onValueChange={(v) => handleChange('cookie_consent', v)}>
                                <SelectTrigger className="h-10 rounded-lg">
                                    <SelectValue placeholder="Choose preference" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="accepted">Accept All Cookies</SelectItem>
                                    <SelectItem value="essential">Essential Only</SelectItem>
                                    <SelectItem value="pending">Pending Review</SelectItem>
                                </SelectContent>
                            </Select>
                        </SettingRow>
                    </SectionCard>
                </div>

            </div>
        </div>
    );
}
