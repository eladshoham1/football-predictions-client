# World Cup 2026 Predictions - Frontend

React + TypeScript frontend for World Cup 2026 predictions platform with beautiful Hebrew UI, real-time updates, and comprehensive prediction features.

## 🚀 Features

- **Hebrew RTL Interface**: Full Hebrew localization with right-to-left support
- **Google Authentication**: Secure OAuth login
- **Match Predictions**: 
  - Predict final scores (0-0 supported)
  - Select first goal scorer
  - Color-coded by match status
- **Group Stage**: Predict team standings (1st-4th place)
- **Knockout Bracket**: Predict winners for all knockout matches
- **Tournament Predictions**:
  - Tournament winner
  - Golden Boot (מלך השערים)
- **Social Features**: View other users' predictions after match starts
- **Live Leaderboard**: Real-time points and rankings
- **User Profile**: Stats and prediction history
- **Responsive Design**: Mobile-first with Tailwind CSS

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend API running (see server repo)

## 🔧 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure API URL in .env.local
VITE_API_URL=http://localhost:4000

# Start development server
npm run dev
```

## 🌍 Environment Variables

### Development

```env
VITE_API_URL=http://localhost:4000
```

### Production

```env
VITE_API_URL=https://your-backend.onrender.com
```

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 5173)

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint
```

## 🚀 Deployment

This app is designed to be deployed on **GitHub Pages** (FREE forever!).

### Quick Deploy Steps

1. **Update Configuration**
   
   Edit `vite.config.ts`:
   ```typescript
   base: '/your-repo-name/'
   ```

   Edit `public/404.html`:
   ```html
   window.location.href = '/your-repo-name/';
   ```

2. **Enable GitHub Pages**
   - Go to repo Settings → Pages
   - Source: GitHub Actions

3. **Add Secret**
   - Settings → Secrets → Actions
   - Add `VITE_API_URL` with your backend URL

4. **Deploy**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

   GitHub Actions will automatically build and deploy to:
   `https://your-username.github.io/your-repo-name/`

**📖 For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🎨 Project Structure

```
client/
├── public/
│   ├── 404.html              # SPA routing support
│   └── vite.svg              # Favicon
├── src/
│   ├── components/           # Reusable UI components
│   ├── pages/                # Route pages
│   │   ├── SignIn.tsx       # Login page
│   │   ├── Matches.tsx      # Match predictions
│   │   ├── GroupStage.tsx   # Group predictions
│   │   ├── Bracket.tsx      # Knockout predictions
│   │   ├── GoldenBoot.tsx   # Golden Boot selection
│   │   ├── Leaderboard.tsx  # Rankings
│   │   └── Profile.tsx      # User profile
│   ├── services/            # API and utilities
│   │   └── hooks.ts         # React Query hooks
│   ├── utils/               # Helper functions
│   │   └── teamUtils.ts     # Hebrew team names
│   ├── api.ts               # API client
│   ├── firebase.ts          # Firebase config (unused)
│   ├── AuthContext.tsx      # Auth provider
│   ├── types.ts             # TypeScript types
│   ├── styles.css           # Global styles
│   ├── App.tsx              # Main app
│   └── main.tsx             # Entry point
├── .env.example             # Environment template
├── .env.local               # Local environment (gitignored)
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
└── package.json             # Dependencies
```

## 🎯 Key Features Explained

### Match Predictions
- **Score Prediction**: Select home and away scores (0-10 goals)
- **First Goal Scorer**: Pick player from dropdown (optional)
- **Color Coding**:
  - 🟢 Green: Prediction submitted
  - 🟡 Yellow: Match started, no prediction
  - ⚪ White: Upcoming, not predicted

### Points System
- **Exact Score**: 10 points
- **Correct Goal Difference**: 7 points
- **Correct Outcome**: 5 points
- **First Goal Scorer Bonus**: +5 points

### Group Stage Predictions
- Drag & drop team rankings (1st-4th place)
- Lock 30 minutes before first tournament match
- Points for correct advancing teams and positions

### Bracket Predictions
- Predict winners for all knockout matches
- Round-specific points (higher stakes in later rounds)
- Automatic progression based on group results

### Golden Boot
- Select player most likely to be top scorer
- Browse by team or search
- Displays team flags and Hebrew names

## 🌐 API Integration

All API calls go through the centralized `api.ts` client:

```typescript
import { api } from './api'

// Example: Get matches
const matches = await api.get('/matches')

// Example: Submit prediction
await api.post('/predictions/match', {
  matchId: '...',
  predictedHomeScore: 2,
  predictedAwayScore: 1,
  firstGoalScorerId: '...'
})
```

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **RTL Support**: Right-to-left layout for Hebrew
- **Mobile First**: Responsive design for all screen sizes
- **Gradients**: Beautiful purple/blue gradients
- **Dark Mode**: (Not implemented, future enhancement)

## 🔒 Authentication Flow

1. User clicks "התחבר עם Google" (Sign in with Google)
2. Redirects to backend OAuth endpoint
3. Backend handles Google authentication
4. Returns JWT token
5. Token stored in AuthContext
6. All API requests include token in Authorization header

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

## 🐛 Troubleshooting

### API Connection Error
```
Failed to fetch
```
→ Check `VITE_API_URL` points to correct backend
→ Ensure backend is running
→ Check CORS configuration on backend

### OAuth Redirect Loop
```
Infinite redirects to /signin
```
→ Check backend `FRONTEND_URL` matches your domain
→ Clear cookies and try again

### Hebrew Text Issues
```
Text showing left-to-right
```
→ Ensure `dir="rtl"` on HTML elements
→ Check Tailwind RTL plugin is installed

### Build Errors
```
Module not found
```
→ Run `npm install` to install dependencies
→ Check import paths are correct

## 🔄 GitHub Actions Workflow

Included `.github/workflows/deploy.yml` for automatic deployment:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Build with Vite
      - Deploy to GitHub Pages
```

## 🌟 Future Enhancements

- [ ] Dark mode toggle
- [ ] Push notifications
- [ ] Live match updates
- [ ] User-to-user messaging
- [ ] Tournament brackets visualization
- [ ] Historical data and analytics
- [ ] Social sharing
- [ ] Multi-language support

## 🏗️ Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite 4
- **Styling**: Tailwind CSS
- **State Management**: React Context + React Query
- **Routing**: React Router DOM (Hash routing)
- **HTTP Client**: Axios
- **Date Formatting**: date-fns

## 📊 Performance

- ⚡ **Fast HMR**: Vite's lightning-fast hot module replacement
- 📦 **Optimized Build**: Tree-shaking and code splitting
- 🎯 **Lazy Loading**: Routes loaded on demand
- 🗜️ **Minified**: Production builds are minified and compressed

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions, open an issue on GitHub.

---

**Built with ❤️ for World Cup 2026**

**עם ישראל חי 🇮🇱**
