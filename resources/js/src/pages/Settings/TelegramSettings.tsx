import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { 
    IconBrandTelegram, 
    IconDeviceFloppy, 
    IconSend, 
    IconHelp, 
    IconCheck, 
    IconX,
    IconInfoCircle,
    IconRefresh,
    IconAlertCircle,
    IconEye,
    IconEyeOff
} from '@tabler/icons-react';

const TelegramSettings = () => {
    const dispatch = useDispatch();
    
    // Form State
    const [botToken, setBotToken] = useState('');
    const [chatId, setChatId] = useState('');
    const [topicId, setTopicId] = useState('');
    const [isActive, setIsActive] = useState(true);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const [botName, setBotName] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

    useEffect(() => {
        dispatch(setPageTitle('Telegram Settings'));
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/telegram');
            if (res.data.configured) {
                setChatId(res.data.chat_id || '');
                setTopicId(res.data.topic_id || '');
                setIsActive(res.data.is_active);
                setHasToken(res.data.has_token);
                setBotName(res.data.bot_name);
                setConnectionStatus(res.data.has_token && res.data.is_active ? 'connected' : 'disconnected');
            }
        } catch (e) {
            console.error("Failed to fetch settings");
            setConnectionStatus('unknown');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = {
                chat_id: chatId,
                topic_id: topicId,
                is_active: isActive
            };
            // Only send token if user typed a new one
            if (botToken) {
                payload.bot_token = botToken;
            }

            const res = await api.post('/settings/telegram', payload);
            setBotName(res.data.bot_name);
            setHasToken(true);
            setBotToken('');
            setConnectionStatus('connected');
            toast.success('Settings saved successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
            setConnectionStatus('disconnected');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!chatId) {
            toast.error("Please enter a Chat ID first");
            return;
        }
        setTesting(true);
        try {
            await api.post('/settings/telegram/test', {
                bot_token: botToken || null, 
                chat_id: chatId,
                topic_id: topicId
            });
            toast.success('Test message sent! Check your Telegram.');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Connection failed');
        } finally {
            setTesting(false);
        }
    };

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
            case 'disconnected':
                return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
            default:
                return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400';
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'Connected & Active';
            case 'disconnected':
                return 'Disconnected';
            default:
                return 'Not Configured';
        }
    };

    // Whole Page Skeleton Loading
    if (loading) {
        return (
            <div>
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            <div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                    </div>
                </div>

                {/* Content Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Form Skeleton */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                            <div className="space-y-6">
                                {/* Bot Token Section */}
                                <div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                                </div>
                                
                                {/* Chat & Topic Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                                    </div>
                                    <div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-4"></div>
                                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                                    </div>
                                </div>

                                {/* Toggle Skeleton */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                </div>

                                {/* Buttons Skeleton */}
                                <div className="flex gap-3 pt-6">
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Guide Skeleton */}
                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 p-6 animate-pulse">
                        <div className="h-6 bg-blue-100 dark:bg-blue-500/20 rounded w-32 mb-4"></div>
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i}>
                                    <div className="h-4 bg-blue-100 dark:bg-blue-500/20 rounded w-full mb-2"></div>
                                    <div className="h-3 bg-blue-100 dark:bg-blue-500/20 rounded w-4/5"></div>
                                </div>
                            ))}
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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-400/10 flex items-center justify-center">
                            <IconBrandTelegram size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Telegram Notifications</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                                Connect your own bot to receive real-time reports and alerts in your team chat
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${getStatusColor()}`}>
                        <div className={`w-2 h-2 rounded-full ${
                            connectionStatus === 'connected' ? 'bg-emerald-500' :
                            connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        {getStatusText()}
                        {botName && connectionStatus === 'connected' && (
                            <span className="ml-2 text-sm font-normal">@{botName}</span>
                        )}
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Bot Configuration Required</h3>
                            <p className="text-blue-700 dark:text-blue-400 text-sm">
                                You need to create a Telegram bot and configure it to receive notifications. Follow the guide on the right for step-by-step instructions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: Configuration Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <form onSubmit={handleSave} className="space-y-6">
                            {/* 1. BOT TOKEN SECTION */}
                            <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">1. Bot Configuration</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Set up your Telegram bot credentials
                                        </p>
                                    </div>
                                    {botName && (
                                        <div className="text-sm font-medium px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
                                            Connected as @{botName}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Bot Token
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showToken ? "text" : "password"} 
                                                className={`w-full px-4 py-3 rounded-lg border ${
                                                    hasToken && !botToken 
                                                        ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10' 
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                                placeholder={hasToken ? "••••••••••••••••••••••••" : "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"} 
                                                value={botToken}
                                                onChange={(e) => setBotToken(e.target.value)}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowToken(!showToken)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                {showToken ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Create a new bot via{' '}
                                                <a 
                                                    href="https://t.me/BotFather" 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                >
                                                    @BotFather
                                                </a>
                                                {' '}and paste the API Token here
                                            </p>
                                            {hasToken && !botToken && (
                                                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                                    <IconCheck size={14} className="mr-1" />
                                                    Token saved securely
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. DESTINATION SECTION */}
                            <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">2. Destination Settings</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Chat ID (Group or User)
                                        </label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                                            placeholder="-100123456789" 
                                            value={chatId}
                                            onChange={(e) => setChatId(e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Add the bot to your group, then use{' '}
                                            <a 
                                                href="https://t.me/RawDataBot" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                            >
                                                @RawDataBot
                                            </a>
                                            {' '}to get the Chat ID
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Topic ID <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                                            placeholder="e.g. 42" 
                                            value={topicId}
                                            onChange={(e) => setTopicId(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Only required if your group has "Topics" enabled
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. SETTINGS SECTION */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">3. Notification Settings</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Control when notifications are sent
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={isActive} 
                                            onChange={(e) => setIsActive(e.target.checked)} 
                                        />
                                        <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                            {isActive ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                >
                                    {saving ? (
                                        <>
                                            <IconRefresh size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <IconDeviceFloppy size={18} />
                                            Save Settings
                                        </>
                                    )}
                                </button>

                                <button 
                                    type="button" 
                                    onClick={handleTest}
                                    disabled={testing || (!botToken && !hasToken)}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {testing ? (
                                        <>
                                            <IconRefresh size={18} className="animate-spin" />
                                            Testing Connection...
                                        </>
                                    ) : (
                                        <>
                                            <IconSend size={18} />
                                            Test Connection
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT: Guide / Instructions */}
                <div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-xl border border-blue-200 dark:border-blue-500/20 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <IconHelp size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-blue-800 dark:text-blue-300">Setup Guide</h3>
                                <p className="text-blue-700 dark:text-blue-400 text-sm">
                                    Step-by-step instructions to configure your bot
                                </p>
                            </div>
                        </div>

                        <ol className="space-y-4">
                            <li className="flex gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Create Bot</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Open{' '}
                                        <a 
                                            href="https://t.me/BotFather" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            @BotFather
                                        </a>
                                        {' '}on Telegram, send <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">/newbot</code>, and copy the Token.
                                    </p>
                                </div>
                            </li>

                            <li className="flex gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Add to Group</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Add your new bot to the Telegram group where you want reports.
                                    </p>
                                </div>
                            </li>

                            <li className="flex gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Get Chat ID</h4>
                                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            The easiest way is to add{' '}
                                            <a 
                                                href="https://t.me/RawDataBot" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                            >
                                                @RawDataBot
                                            </a>
                                            {' '}to the same group
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            It will post a JSON message. Look for <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">chat: id</code> (starts with -100)
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            Kick @RawDataBot after you get the ID
                                        </li>
                                    </ul>
                                </div>
                            </li>

                            <li className="flex gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center">
                                    4
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Test Connection</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Click "Test Connection" to confirm it works. Check your Telegram for the test message.
                                    </p>
                                </div>
                            </li>
                        </ol>

                        {/* Important Note */}
                        <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                            <div className="flex items-start gap-2">
                                <IconAlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    <strong>Important:</strong> Make sure your bot has message permissions in the group. Some groups may restrict new bots.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TelegramSettings;