# AI Chat Assistant

A modern, responsive chat application built with Next.js that integrates with OpenRouter's AI models. The application provides a clean, user-friendly interface for interacting with various AI models.

## System Architecture

```mermaid
graph TD
    A[Client Browser] --> B[Next.js Frontend]
    B --> C[OpenRouter API]
    C --> D[AI Models]
    D --> |DeepHermes| E[Model 1]
    D --> |Llama| F[Model 2]
    D --> |Gemma| G[Model 3]
    D --> |Mistral| H[Model 4]
    D --> |Sarvam| I[Model 5]
    D --> |DeepSeek| J[Model 6]
```

## Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS3 with modern features
- **State Management**: React Hooks
- **API Integration**: Fetch API

### Backend Integration
- **API Provider**: OpenRouter
- **Authentication**: API Key based
- **Models**: Multiple AI models with fallback mechanism

## Features

- 🤖 Multiple AI Model Support
  - NousResearch DeepHermes
  - Meta Llama
  - Google Gemma
  - Mistral AI
  - Sarvam AI
  - DeepSeek

- 💬 Real-time Chat Interface
  - Clean, modern UI
  - Message history
  - Loading animations
  - Responsive design

- 🎨 Modern UI/UX
  - Smooth animations
  - Responsive layout
  - Mobile-friendly design
  - Dynamic message formatting

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- OpenRouter API key

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-chat-assistant
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your OpenRouter API key:
```env
NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=AI Chat Assistant
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main chat interface
├── utils/
│   ├── chat.ts        # Chat utilities and API calls
│   └── constants.ts   # Configuration constants
```

## Implementation Details

### 1. Chat Interface
```typescript
// Message Interface
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// API Configuration
const API_URLS = {
    OPENROUTER_API: "https://openrouter.ai/api/v1/chat/completions",
    LOCAL_URL: "http://localhost:3000"
};
```

### 2. Model Integration
```typescript
const AI_MODELS = [
    "nousresearch/deephermes-3-mistral-24b-preview:free",
    "meta-llama/llama-3.3-8b-instruct:free",
    "google/gemma-3n-e4b-it:free",
    // ... other models
];
```

### 3. API Call Structure
```typescript
const response = await fetch(API_URLS.OPENROUTER_API, {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: currentModel,
        messages: chatHistory
    })
});
```

## CSS Architecture

```mermaid
graph TD
    A[Global Styles] --> B[Layout]
    A --> C[Components]
    B --> D[Chat Container]
    C --> E[Message Bubbles]
    C --> F[Input Area]
    C --> G[Loading Animation]
```

### Key CSS Features
- CSS Variables for theming
- Flexbox for layout
- CSS Grid for complex layouts
- CSS Animations
- Media Queries for responsiveness

## Technologies Used

- Next.js 14
- TypeScript
- CSS3 with modern features
- OpenRouter API

## Features in Detail

### AI Model Integration
- Automatic model fallback if one fails
- Support for multiple AI models
- Real-time model switching

### UI Components
- Responsive chat container
- Message bubbles with different styles for user and bot
- Loading animations
- Input area with send button
- Formatted message display

### Message Formatting
- Support for numbered lists
- Proper spacing and alignment
- Dynamic content rendering

## Performance Considerations

1. **API Optimization**
   - Model fallback mechanism
   - Error handling
   - Response caching

2. **UI Performance**
   - Lazy loading
   - Optimized animations
   - Efficient state management

3. **Responsive Design**
   - Mobile-first approach
   - Flexible layouts
   - Adaptive components

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenRouter for providing access to multiple AI models
- Next.js team for the amazing framework
- All contributors who have helped improve this project
