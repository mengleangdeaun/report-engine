export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL;

// 2. Helper function to generate full image URLs
export const getStoragePath = (path: string | null) => {
    if (!path) return '/assets/images/profile.svg'; // Optional: Default image
    if (path.startsWith('http')) return path; // Already a full URL (e.g. Facebook avatar)
    return `${STORAGE_URL}/${path}`;
};