# Welcome to your BerlinKiez

## Project info

## How can I edit this code?


# Step 1: Create a `.env` file with your Supabase credentials.
# You can use the provided `.env.example` as a template.
cat <<EOF > .env
VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
EVENTBRITE_CLIENT_ID=<YOUR_EVENTBRITE_CLIENT_ID>
EVENTBRITE_CLIENT_SECRET=<YOUR_EVENTBRITE_CLIENT_SECRET>
SESSION_SECRET=<ANY_RANDOM_STRING>
EOF


# Step 2: Install the necessary dependencies.
npm i

# Step 3: Start the Express API server.
npm run dev:server

# Step 4: Start the Vite dev server with auto-reloading and an instant preview.

npm run dev
```
**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

