import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import laravel from "laravel-vite-plugin";

export default defineConfig({
    // Remove the 'server' block entirely for ngrok single-port use
    plugins: [
        laravel({
            input: ["resources/js/src/main.tsx"],
            refresh: true,
        }),
        react()
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./resources/js/src"), // Fixed path alias
        },
    },
});