# Recommerce AI Helper

A minimalist React app to help you generate compelling marketplace listings and select the best category for your item using OpenAI's GPT API.

## Features
- Accessible, minimalist UI
- Form for item details (name, condition, notes)
- AI-generated marketing text and category suggestion
- Uses a subset of Google product taxonomy categories
- Error handling and accessibility best practices
- Easy to extend and customize

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- An OpenAI API key ([get one here](https://platform.openai.com/))

### Installation
1. Clone the repo:
   ```sh
   git clone <your-repo-url>
   cd recommmerce-ai-helper
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Create a `.env` file in the project root (see example below).
4. Start the dev server:
   ```sh
   npm run dev
   # or
   yarn dev
   ```

### Example .env file
```
VITE_OPENAI_API_KEY=sk-...
```

## Security Note
**Never expose your OpenAI API key in client-side code for production!**
- For production, set up a backend proxy to securely handle API requests.
- The current setup is for local development and demo purposes only.

## Design Choices
- Custom CSS for performance and simplicity
- All form fields have labels and focus states for accessibility
- AI prompt is engineered to request both marketing text and category in JSON format
- Only categories from the allowed subset are accepted

## Extending
- To use a different AI model, update the API call in `src/App.tsx`
- To change categories, edit the `CATEGORIES` array in `src/App.tsx`
- To add more fields, extend the form and prompt logic

## Testing
- Add unit tests for prompt generation in `src/pitchGenerator.ts`

## License
MIT

