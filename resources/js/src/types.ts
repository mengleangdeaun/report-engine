export interface User {
    id: number;
    name: string;
    email: string;
    token_balance: number;
    roles: string[]; // ✅ Array of strings
    permissions?: string[]; // Optional: if you use permissions later
}