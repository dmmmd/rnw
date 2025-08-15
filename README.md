# Recommerce AI Helper

A minimalist React app to help you generate compelling marketplace listings and select the best category for your item using OpenAI's GPT API.
This is my first ever attempt to implement any React (or any modern frontend) application. As such, in order to stay within the time limits for the prototype, I have made the following decisions:
- Use AI to suggest how to begin, it pointed me towards the Vite tool. I doubt that I need it for the real product, but it helped me with a skeleton
- As a first-time React user, it's impossible for me to even fake any mastery with it, so I have only focused on making it work
- In a similar vein, I decided to implement the functional requirements first, and all the rest later. Functionally it mostly works -- it does generate the sales pitch and picks the category. The quality of both features is low
- The business code is slapped together very quickly, naming, code locations are all over the place
- I have googled the categorisation problem very-very quickly, and also used the AI coding assistant to generate a local matcher. It ran, but produced completely irrelevant outcomes. It is available in the commit history
- There was no time for other algorithmic attempts, so I went and reused OpenAI for that as well. That's where it's helpful to limit the amount of categories
- Judging by a quick research, a realistic categorisation solution might be in using theOpenAI embeddings in combination with vector search server-side
- Obviously, I had to hack around the CORS issue with the Google taxonomy file. In the real world, it should be read, processed and cached server-side

## How to use

### Prerequisites
- git
- npm
- An OpenAI API key ([get one here](https://platform.openai.com/))

### Installation
1. Clone the repo:
   ```sh
   git clone git@github.com:dmmmd/rnw.git recommmerce-ai-helper 
   cd recommmerce-ai-helper
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the project root, paste an OpenAI key:
```
VITE_OPENAI_API_KEY=sk-...
```
4. Start the dev server:
   ```sh
   npm run dev
   ```
5. Open browser: http://localhost:5173/

## Todos

Strict time constraints were placed for this attempt, so the result is certainly of a prototype quality, lots of shortcuts taken.
What I should do during next steps:

### Better AI use
- Pick the best model for the purpose https://platform.openai.com/docs/models
- Prompt engineering: split the instructions between the appropriate roles https://platform.openai.com/docs/guides/text#message-roles-and-instruction-following
- Use the embeddings to store the taxonomy nodes https://platform.openai.com/docs/guides/embeddings https://platform.openai.com/docs/guides/embeddings#use-cases
- Use the SDK
- Use the structured output https://platform.openai.com/docs/guides/structured-outputs?lang=javascript

### Server-side API
- One or two endpoints to generate the listing, instead of using the AI directly
- Naturally, it would also hide the API key from the client
- Fetch, parse and store the Google product categories in some database, maintain it automatically
- Use pgvector to store and search the taxonomy vectors from OpenAI embeddings
- Sanitise user input in effort to reduce costs and avoid abuse
- Introduce some rate limiting and/or other measures to limit the costs
- Some layer of caching the user input to avoid using the AI. Cache should be smart enough to understand similar matches, not just exact
- Autocomplete in the input field could be helpful for the user AND for our caching efforts

As part of it, clearly the whole `/ai` namespace goes server-side, so does most of the `/goods`.

### Quality
- Pick and use a testing framework, cover all the business logic and hopefully the UI
- Introduce real logging, both for server and client side, with results ending up in some Kibana
- Introduce real error handling. It includes specific error classes for important cases, so that they can be tracked easily
- Error handling must log, but not show the technical messages and details to the user. Public UI must translate everything into user-friendly simple messages
- Current prototype is very optimistic, real code cannot expect the correct returns or input, so I must handle that
- I would maybe let players teach our system when suggested categories are bad -- let them pick from several options
- In the same spirit -- we should use our own accumulated data from previously published positions and use the categories and/or pitches from there
 
### Clean up and refactor
- Remove some possibly unnecessary Vite template files
- Read about the React practices and likely split the App.tsx into some components
- Use some UX framework instead of my custom css files
- Rename and move the business logic around, I don't like the current naming, nor their locations
