import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const initEcho = async () => {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        if (config.pusher && config.pusher.key) {
            window.Echo = new Echo({
                broadcaster: 'pusher',
                key: config.pusher.key,
                cluster: config.pusher.cluster,
                forceTLS: config.pusher.forceTLS,
                enabledTransports: ['ws', 'wss'],
                auth: {
                    headers: {
                        Authorization: 'Bearer ' + localStorage.getItem('token'),
                    },
                },
            });
        } else {
            // Fallback to Env if API fails or returns empty
            console.warn('Pusher config not found in DB, falling back to ENV');
            window.Echo = new Echo({
                broadcaster: 'pusher',
                key: import.meta.env.VITE_PUSHER_APP_KEY,
                cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
                wsHost: import.meta.env.VITE_PUSHER_HOST ? import.meta.env.VITE_PUSHER_HOST : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
                wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
                wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
                forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
                enabledTransports: ['ws', 'wss'],
                auth: {
                    headers: {
                        Authorization: 'Bearer ' + localStorage.getItem('token'),
                    },
                },
            });
        }
    } catch (error) {
        console.error('Failed to load Pusher config', error);
        // Fallback to Env
        window.Echo = new Echo({
            broadcaster: 'pusher',
            key: import.meta.env.VITE_PUSHER_APP_KEY,
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
            wsHost: import.meta.env.VITE_PUSHER_HOST ? import.meta.env.VITE_PUSHER_HOST : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
            wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
            wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
            forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
            auth: {
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('token'),
                },
            },
        });
    }
};

initEcho();
