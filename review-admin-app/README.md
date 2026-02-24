# DuraCalm Review Admin

A simple, standalone internal tool for managing Shopify product reviews through metaobjects.

## Features

- ✅ Create, edit, and delete reviews
- ✅ Visual star rating picker
- ✅ Product dropdown (auto-fetched from your store)
- ✅ Search and filter reviews
- ✅ Stats dashboard (total, featured, verified, average rating)
- ✅ Avatar image support
- ✅ All 10 metaobject fields supported
- ✅ Automatic authentication via Shopify's Client Credentials Grant
- ✅ Credentials stored locally in your browser

## Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start the Proxy Server

The proxy server handles Shopify OAuth requests (bypassing CORS restrictions):

```bash
npm run proxy
```

You should see:
```
Shopify Auth Proxy Server
Server running on: http://localhost:3001
```

**Keep this terminal running.**

### Step 3: Start the React App

Open a **new terminal** and run:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 4: Create Your Shopify Custom App

1. Go to your Shopify Admin: https://admin.shopify.com/store/porongas-2
2. Click **Settings** (bottom left) → **Apps and sales channels**
3. Click **Develop apps**
4. Click **Create an app**
5. Name it **"Review Admin"**
6. Click **Create app**

### Step 5: Configure Admin API Scopes

1. In your app, go to the **Configuration** tab
2. Under **Admin API access scopes**, click **Configure**
3. Enable these permissions:
   - ✅ `read_products`
   - ✅ `read_metaobjects`
   - ✅ `write_metaobjects`
4. Click **Save**

### Step 6: Install the App

1. Click **Install app** (top right)
2. Click **Install** to confirm

### Step 7: Get Your Credentials

1. Go to the **API credentials** tab
2. Copy the **Client ID** (looks like a long alphanumeric string)
3. Copy the **Client secret** (starts with `shpss_...`)
4. **Important:** Do NOT copy the "Admin API access token" - that's the old method

### Step 8: Connect the App

1. In the Review Admin app (http://localhost:3000), enter your **Client ID** and **Client Secret**
2. Click **Connect to Shopify**
3. The app will automatically exchange your credentials for an access token
4. Start managing reviews!

## Architecture

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│  React App      │──────▶│  Proxy Server│──────▶│  Shopify API    │
│  localhost:3000 │      │  localhost:3001     │  (OAuth + Admin)│
└─────────────────┘      └──────────────┘      └─────────────────┘
       │
       └───────────────────────────────────────────────────────▶
                    (GraphQL requests with token)
```

**Why the proxy?**
Shopify's OAuth endpoint doesn't allow direct browser requests (CORS restriction). The proxy runs locally and forwards the authentication request server-to-server, which is allowed.

## How Authentication Works

1. You enter Client ID and Client Secret in the browser
2. Browser sends them to the local proxy (localhost:3001)
3. Proxy forwards to Shopify's OAuth endpoint
4. Shopify returns an access token
5. Proxy returns the token to the browser
6. Browser stores token and uses it for all API requests

Your credentials are stored in your browser's localStorage and are never sent to any external server except Shopify's.

## Deploying for Production (Optional)

Since this is for internal use only, you can deploy it to Vercel for free:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd review-admin-app
vercel
```

Then set up password protection:
1. Go to Vercel dashboard
2. Select your project → **Settings** → **Deployment Protection**
3. Enable **Vercel Authentication** (requires login to access)

## Usage Guide

### Adding a Review

1. Click **+ Add Review**
2. Fill in the form:
   - **Reviewer Name** (required)
   - **Rating** (required) - click the stars
   - **Review Text** (required)
   - **Title** (optional) - headline for the review
   - **Location** (optional) - e.g., "New York, NY"
   - **Product** (optional) - select from dropdown
   - **Review Date** - defaults to today
   - **Avatar Image URL** (optional) - URL to customer photo
   - **Verified Purchase** - check if customer bought the product
   - **Featured** - check to show on homepage
3. Click **Create Review**

### Editing a Review

1. Find the review in the list
2. Click **Edit**
3. Make changes
4. Click **Update Review**

### Deleting a Review

1. Find the review in the list
2. Click **Delete**
3. Confirm deletion

### Searching and Filtering

- Use the search box to find reviews by name, text, or title
- Check "Featured only" to show only featured reviews

### Disconnecting

Click **Disconnect** in the header to clear your credentials and access token from the browser.

## Data Fields

All 10 metaobject fields are supported:

| Field | Required | Description |
|-------|----------|-------------|
| `reviewer_name` | ✅ | Customer's name |
| `rating` | ✅ | 1-5 star rating |
| `review_text` | ✅ | The review content |
| `title` | ❌ | Optional headline |
| `location` | ❌ | Customer's location |
| `product` | ❌ | Linked product (from dropdown) |
| `verified_purchase` | ❌ | Boolean - purchased the product? |
| `featured` | ❌ | Boolean - show on homepage? |
| `review_date` | ❌ | Date of the review |
| `avatar_image` | ❌ | Customer photo URL |

## Security Notes

- Your Client ID, Client Secret, and access token are stored in your browser's localStorage
- Credentials are only sent to:
  - Your local proxy server (localhost:3001)
  - Shopify's API endpoints
- The proxy server runs only on your local machine
- For additional security when deploying, use Vercel's password protection

## Troubleshooting

### "Failed to fetch" or CORS errors
- Make sure the proxy server is running (`npm run proxy` in a separate terminal)
- Check that the proxy is on port 3001 and the React app is on port 3000

### "Failed to authenticate" or authentication errors
- Make sure you copied the correct Client ID and Client Secret (not the Admin API token)
- Verify the app is installed in your Shopify store
- Check that the required scopes are enabled

### Changes not appearing on the website
- The app creates/updates reviews immediately in Shopify
- If not showing on the site, check that:
  1. The section using reviews is set to "metaobjects" data source
  2. The product is correctly linked (if applicable)
  3. The review is published (not in draft)

## Development

Built with:
- React + Vite
- Tailwind CSS
- Shopify Admin GraphQL API
- Client Credentials Grant OAuth flow
- Express.js proxy server

To modify:
1. Edit `src/App.jsx` for the frontend
2. Edit `proxy.js` for the authentication proxy
3. Run `npm run dev` to see frontend changes
4. The proxy auto-reloads on save

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the React development server (port 3000) |
| `npm run proxy` | Start the authentication proxy server (port 3001) |
| `npm run build` | Build the React app for production |
| `npm run preview` | Preview the production build locally |

## Authentication Method: Client Credentials Grant

This app uses Shopify's recommended **Client Credentials Grant** flow instead of the deprecated legacy method where tokens were visible in the admin.

**Why this method?**
- Follows current Shopify best practices (2024-2025)
- More secure - no static tokens to leak
- Automatic token management
- No need to manually reveal or copy tokens

**What's stored:**
```
localStorage:
├── shopify_client_id        (your app's client ID)
├── shopify_client_secret    (your app's client secret)
├── shopify_access_token     (the token obtained via OAuth)
├── shopify_token_scope      (granted permissions)
└── shopify_token_created    (timestamp for potential refresh)
```

## Important: Legacy vs New Custom Apps

| Feature | Legacy (Pre-2024) | New (2024+) |
|---------|-------------------|-------------|
| Token visibility | Visible in admin after install | Not visible - must use OAuth |
| This app supports | ❌ No | ✅ Yes |
| Required credentials | Admin API token | Client ID + Client Secret |

If you created a custom app before 2024, you may need to create a new one following the steps above.
