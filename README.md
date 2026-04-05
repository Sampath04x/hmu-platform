# intrst | Find Your Actual People

intrst is a premium, AI-powered social platform designed specifically for college campuses. It goes beyond proximity friends to find your true tribe based on deep compatibility and niche interests.

## 🚀 Features

- **AI-Powered Matching**: Our proprietary matching engine analyzes your interests and personality to find your most compatible campus connections.
- **Anonymous Discovery**: Connect with matches using codenames and voice messages. Reveal your identity only when you both feel ready.
- **Campus Pulse**: Real-time updates on canteen ratings, professor reviews, events, and community discussions.
- **Verified Network**: Access restricted to verified institutional email domains (@gitam.in, etc.).

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Anime.js
- **Backend**: Node.js, Express, Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Zustand, UserContext

## 🚦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Sampath04x/hmu-platform.git
cd hmu-platform
```

### 2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Setup
Create a `.env.local` in the root and a `.env` in the `backend/` directory based on the `.env.example` files provided.

### 4. Run Development Servers
```bash
# Root directory (Frontend)
npm run dev

# backend directory (Backend)
cd backend
npm start
```

## 🔒 Security & Access
- **Super Admins**: Defined in backend environment.
- **Institutional Lock**: Verification required via campus email domains.
- **Data Privacy**: Encrypted profiles and anonymous interaction layers.

---
Built with ❤️ for the campus community.
