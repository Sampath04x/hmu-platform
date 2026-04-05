# intrst Platform Features & Security Specification

This document details the features, access control levels, and security measures implemented in the intrst platform.

## 1. Feature Map

### 🎨 Design & Interaction
- **Premium UI**: Dark-themed, glassmorphic design using Tailwind CSS and Framer Motion.
- **Dynamic Animations**: Smooth transitions and hover effects using Anime.js and native CSS animations.
- **Responsive Layout**: Fully optimized for mobile, tablet, and desktop viewing.
- **Footer**: Integrated "About Us" and "Contact Us" sections for institutional transparency.

### 🏠 Main Hub
- **Interest-Based Feed**: Posts are filtered and sorted based on user interests.
- **Media Posting**: Exclusive feature for Clubs and verified organizations.
- **Pinned Posts**: Important announcements or events are pinned at the top for maximum visibility.

### 🏢 Classroom Locator (Community Feature)
- **Real-Time Occupancy**: Building-wise summary of vacant vs. occupied classrooms.
- **Student Reporting**: Peer-to-peer reporting system (+3 activity points for room additions).
- **Verification System**: Voting mechanism (+1 point for confirmations) to ensure data accuracy.
- **Timetable Views**: Semester-wise schedule integration for every classroom, manually updated by Junior Moderators.

### 🛡️ Admin & Moderation
- **Admin Control Center**: Comprehensive dashboard for user, club, and system management.
- **Granular Permissions**: Role assignment for Finance, Database Access, and Analytics oversight.
- **Activity Monitoring**: Real-time tracking of user points, levels, and flagging status.
- **Shadowban Mode**: Discreetly limit problematic users without full account suspension.
- **Auto-Flag Threshold**: Configurable system to automatically flag high-frequency or suspicious activity.

### 🏢 Club Authentication
- **Verified G-Suite Emails**: Automatic club recognition for addresses ending in `_vsp@gitam.in`.
- **Interaction Heatmaps**: Visual engagement analytics (clicks, follows, reactions) for club owners.
- **Follower Trends**: Time-series graphs showing community growth and interaction spikes.

## 2. Access Control (RBAC)

| Role | Permissions |
| :--- | :--- |
| **Super Admin / Founder** | Global oversight, finance controls, DB access, and permission management. |
| **Moderator** | Manage community/club requests, delete posts, and warn/flag profiles. |
| **Junior Moderator** | Manage email whitelist requests and classroom occupancy reports. |
| **Club Account** | Exclusive media posting, engagement analytics, and pinned profile updates. |
| **Community Admin** | Manage niche groups, moderate local comments, and pin community posts. |
| **Default User** | Browse rooms, vote on status, join communities, and text-based posting. |

**Key Admin Emails:**
- **Founders:** `sampathkottisa7@gmail.com`, `manishbusaramoni@gmail.com`
- **Moderator:** `bkedhar10@gmail.com`

## 3. Privacy & Security Features

### 🔐 Authentication & Identity
- **Passwordless Login**: Secure OTP-based authentication via Email (Supabase Auth).
- **Domain Whitelisting**: Students auto-verified for `@vsp.gitam.in` and `@student.gitam.edu`.
- **Manual Verification**: Non-campus emails must submit a request to `intrst2026@gmail.com`.
- **Anti-Parallel Sessions**: Prevents multiple concurrent logins to maintain session integrity.

### 🛑 Integrity & Moderation
- **Activity Points System**: Rewards users for constructive contributions; points removed for deleted content.
- **Daily Limits**: tiered activity caps (e.g., 20 actions/day for verified users, 10 for flagged accounts).
- **Audited Actions**: Sensitive administrative changes (role updates, deletions) are logged for founder review.

## 4. Hosting & Infrastructure
- **Frontend**: Next.js App Router (Vercel/Hostinger).
- **Backend**: Node.js Express API (Render/Hostinger).
- **Database**: PostgreSQL (Supabase) with strict Row Level Security (RLS).
- **Real-Time**: WebSockets/Polling for live classroom updates.
- **Storage**: Media assets and institutional assets managed via Supabase Storage.
