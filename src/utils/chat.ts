import { ReactNode } from 'react';
import { API_URLS, DEFAULT_CONFIG } from './constants';

export const AI_MODELS = [
    "nousresearch/deephermes-3-mistral-24b-preview:free",
    "meta-llama/llama-3.3-8b-instruct:free",
    "google/gemma-3n-e4b-it:free",
    "mistralai/devstral-small:free",
    "sarvamai/sarvam-m:free",
    "deepseek/deepseek-r1-0528:free"
];

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const tryNextModel = async (
    input: string,
    messages: Message[],
    currentModelIndex: number,
    onModelChange: (model: string) => void
): Promise<string> => {
    if (currentModelIndex >= AI_MODELS.length) {
        throw new Error('All models failed to respond');
    }

    const model = AI_MODELS[currentModelIndex];
    onModelChange(model);

    try {
        const response = await fetch(API_URLS.OPENROUTER_API, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${DEFAULT_CONFIG.API_KEY}`,
                "HTTP-Referer": DEFAULT_CONFIG.SITE_URL,
                "X-Title": DEFAULT_CONFIG.SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    ...messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    {
                        role: "user" as const,
                        content: input
                    }
                ]
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Invalid response from API');
        }
    } catch (error) {
        // Try the next model
        return tryNextModel(input, messages, currentModelIndex + 1, onModelChange);
    }
};

export const formatMessage = (content: string): string | string[] => {
    // Split content by newlines
    const lines = content.split('\n');

    // Check if content contains numbered list
    const hasNumberedList = lines.some(line => /^\d+\./.test(line.trim()));

    if (hasNumberedList) {
        return lines.map(line => line.trim());
    }

    return content;
}; 