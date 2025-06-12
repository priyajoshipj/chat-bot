export const API_URLS = {
    OPENROUTER_API: "https://openrouter.ai/api/v1/chat/completions",
    LOCAL_URL: "http://localhost:3000"
} as const;

export const DEFAULT_CONFIG = {
    SITE_NAME: "AI Chat Assistant",
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || API_URLS.LOCAL_URL,
    API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
} as const; 