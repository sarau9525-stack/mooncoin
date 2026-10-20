# 🌕 MOONCOIN 🪐

**Telegram Mini App + Full-Featured Standalone Web Cosmic Clicker & Civilization Builder**

MOONCOIN is a high-performance, responsive idle cosmic clicker and planet-building game where players start with a celestial Moon asteroid, tap to harvest MoonCoins, construct advanced planetary megastructures, summon rare alien companions, evolve through 6 planetary civilization tiers, explore new worlds, and compete on the global leaderboard.

---

## ⚡ Deployment to Cloudflare Pages & GitHub

MOONCOIN is 100% optimized and pre-configured for **GitHub** and **Cloudflare Pages**:

### Option 1: In-App 1-Click DevOps Hub (Recommended)
1. Launch the app and click the **Cloud icon** in the top header (or open **Settings > Automated Deployment Hub**).
2. Enter your **GitHub Personal Access Token (PAT)** with `repo` permission.
3. Choose your repository name (default: `mooncoin`).
4. Click **"Upload Project to GitHub (Auto-Cloudflare)"**.
   - Automatically pushes all source code, `functions/api/[[route]].ts`, `public/_redirects`, `public/_headers`, `wrangler.jsonc`, and `.github/workflows/cloudflare-pages.yml`.
5. In **Cloudflare Dashboard**:
   - Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Select your `mooncoin` repository.
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - Click **Save and Deploy**.
6. Your application will be live at `https://mooncoin.pages.dev` in seconds!

### Option 2: Direct Wrangler CLI Deployment
```bash
# Build the production bundle
npm run build

# Deploy directly to Cloudflare Pages
npx wrangler pages deploy dist --project-name=mooncoin
```

---

## 🤖 Telegram Bot & Webhook Setup

1. Open **[@BotFather](https://t.me/BotFather)** in Telegram:
   - Create a bot: `/newbot` (e.g. `MoonCoinBot`)
   - Copy your **Bot Token** (e.g. `789123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
   - Create the Mini App: `/newapp`
   - Set the WebApp URL to your Cloudflare Pages domain (e.g. `https://mooncoin.pages.dev`)
2. In the MOONCOIN **Deployment Hub** modal:
   - Switch to the **Telegram Webhook Setter** tab.
   - Paste your Bot Token.
   - Click **"Auto-Set Webhook to Current App Endpoint"**.
   - The bot will instantly greet users who send `/start` or `/play` with an interactive button that launches MOONCOIN!

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local server with Express and Vite
npm run dev

# 3. Run automated tests
npm test

# 4. Build for production
npm run build
```

---

## 🛡️ Edge & Offline Resiliency Architecture

- **Dual-Mode Engine**: Operates with a server-authoritative backend (Node.js/Express) AND an edge-compatible Cloudflare Pages Function (`functions/api/[[route]].ts`).
- **Zero-Failure Client Fallback**: If the server or edge is unreachable or offline, the client seamlessly runs locally with `localStorage` persistence, ensuring the game never freezes or shows an error screen.
- **Telegram Mini App Compatibility**: Pre-configured HTTP headers (`public/_headers`) allow embedding inside Telegram Web iframes without CORS or frame-ancestor blocks.
- **Master Admin Panel**: Built-in master admin management for player balances, custom coin awards, user deletion, level adjustments, and global galaxy airdrops.
