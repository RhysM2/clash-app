# Clash Royale Card Counter - Frontend

React frontend for the Clash Royale Card Counter application.

## Features

- Search for players by tag
- View player profile and statistics
- Analyze opponent card frequency
- See your win rate against each card
- Filter by battle type and time range
- View card metadata including icons, rarity, and elixir cost

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL:
   - Update `src/config.js` with your backend API URL

3. Run development server:
```bash
npm start
```

4. Build for production:
```bash
npm run build
```

5. Deploy to GitHub Pages:
```bash
npm run deploy
```

## Backend Configuration

Before deploying, ensure your backend server (Azure VM) allows CORS requests from your GitHub Pages URL:

```javascript
const corsOptions = {
  origin: ['http://localhost:3000', 'https://rhysm2.github.io'],
  credentials: true
};
```

## Architecture

- **React** - UI framework
- **Axios** - HTTP client
- **CSS** - Styling with responsive design
- **GitHub Pages** - Static hosting

## API Endpoints Used

- `GET /api/player/:tag` - Fetch player profile
- `GET /api/cardcounts?tag=:tag&types=:types&timeRange=:range` - Get card analysis
- `GET /api/cards` - Get all cards metadata
