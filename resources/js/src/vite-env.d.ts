/// <reference types="vite/client" />

import { AxiosRequestConfig } from 'axios';

declare module 'axios' {
    export interface AxiosRequestConfig {
        _skipToast?: boolean;
    }
}
