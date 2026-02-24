import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';

const SystemConfig = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingTelegram, setTestingTelegram] = useState(false);

    const [formData, setFormData] = useState({
        telegram_bot_token: '',
        telegram_chat_id: '',
        telegram_topic_id: '',
        telegram_bot_name: '',
        pusher_app_id: '',
        pusher_app_key: '',
        pusher_app_secret: '',
        pusher_app_cluster: 'mt1',
    });

    useEffect(() => {
        dispatch(setPageTitle('System Configuration'));
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            setFormData(response.data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
            toast.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await api.post('/admin/settings', formData);
            if (response.data.bot_name) {
                setFormData(prev => ({ ...prev, telegram_bot_name: response.data.bot_name }));
            }
            toast.success('System configuration has been updated.');
        } catch (error) {
            toast.error('Failed to update settings.');
        } finally {
            setSaving(false);
        }
    };

    const testTelegramConnection = async () => {
        setTestingTelegram(true);
        try {
            await api.post('/admin/settings/test-telegram', {
                telegram_bot_token: formData.telegram_bot_token,
                telegram_chat_id: formData.telegram_chat_id,
                telegram_topic_id: formData.telegram_topic_id,
            });
            toast.success('Connected! Test message sent successfully.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Could not connect to Telegram Bot.');
        } finally {
            setTestingTelegram(false);
        }
    };

    if (loading) return <div className="p-5">Loading...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    System Configuration
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Telegram Settings */}
                <div className="panel" id="telegram_settings">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg">Telegram Notification Settings</h5>
                        {formData.telegram_bot_name && (
                            <span className="badge bg-success/20 text-success rounded-full px-3 py-1">
                                Connected as: @{formData.telegram_bot_name}
                            </span>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="telegram_bot_token">Bot Token</label>
                            <input
                                id="telegram_bot_token"
                                name="telegram_bot_token"
                                type="password"
                                className="form-input"
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                value={formData.telegram_bot_token}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-gray-500 mt-1">From @BotFather</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="telegram_chat_id">Chat ID</label>
                                <input
                                    id="telegram_chat_id"
                                    name="telegram_chat_id"
                                    type="text"
                                    className="form-input"
                                    placeholder="-100xxxxxxxxxx"
                                    value={formData.telegram_chat_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="telegram_topic_id">Topic ID (Optional)</label>
                                <input
                                    id="telegram_topic_id"
                                    name="telegram_topic_id"
                                    type="text"
                                    className="form-input"
                                    placeholder="For forums"
                                    value={formData.telegram_topic_id}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={testTelegramConnection}
                                disabled={testingTelegram || !formData.telegram_bot_token}
                                className="btn btn-outline-info w-full"
                            >
                                {testingTelegram ? 'Testing...' : (
                                    <>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ltr:mr-2 rtl:ml-2">
                                            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        </svg>
                                        Test Connection
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pusher Settings */}
                <div className="panel" id="pusher_settings">
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg">Pusher / Reverb Settings</h5>
                        <p className="text-xs text-gray-500 mt-1">
                            Used for real-time updates. Note: Frontend keys might need a rebuild if changed here depending on deployment.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="pusher_app_id">App ID</label>
                                <input
                                    id="pusher_app_id"
                                    name="pusher_app_id"
                                    type="text"
                                    className="form-input"
                                    value={formData.pusher_app_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="pusher_app_cluster">Cluster</label>
                                <input
                                    id="pusher_app_cluster"
                                    name="pusher_app_cluster"
                                    type="text"
                                    className="form-input"
                                    placeholder="mt1"
                                    value={formData.pusher_app_cluster}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="pusher_app_key">App Key</label>
                            <input
                                id="pusher_app_key"
                                name="pusher_app_key"
                                type="text"
                                className="form-input"
                                value={formData.pusher_app_key}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="pusher_app_secret">App Secret</label>
                            <input
                                id="pusher_app_secret"
                                name="pusher_app_secret"
                                type="password"
                                className="form-input"
                                value={formData.pusher_app_secret}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="lg:col-span-2 flex justify-end">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="px-10"
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SystemConfig;
