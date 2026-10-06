# 🔒 Signal Clone — Secure Messaging Platform

A full-stack Signal Messenger clone replicating Signal's design, user experience, and core messaging workflows with pixel-perfect fidelity.

Built with **Next.js (TypeScript)**, **FastAPI (Python)**, **SQLite**, and **WebSockets** for real-time bi-directional messaging, presence, and receipts.

---

## 🎨 Features & Highlights

### 1. 🔐 Authentication & Onboarding
- **Phone Number / Username Auth**: Mock OTP verification (`123456`).
- **Profile Customization**: Display name, custom avatar, and status bio quote.
- **Fast Demo Switcher**: One-click quick login buttons to switch instantly between seeded accounts:
  - 👤 **Alice Vance** (`alice` / `+15550101`) — Dev Lead (Admin)
  - 👤 **Bob Smith** (`bob` / `+15550102`) — Product Designer
  - 👤 **Charlie Brown** (`charlie` / `+15550103`) — Security Researcher
  - 👤 **Dana Scully** (`dana` / `+15550104`) — Systems Architect
- **Session Persistence**: JWT Bearer token authentication with local storage session restore.

### 2. 📇 Contacts & Conversation List
- **Left Sidebar Navigation**: Recreates Signal Desktop split-pane view.
- **Sorting & Search**: Sorted by most recent activity; instant search across contacts & active chats.
- **Filter Pills**: `All`, `Unread`, `Groups`.
- **Indicators**: Unread count badges, last-message preview, timestamp, online green status dot, disappearing message clock icon.

### 3. 💬 Real-Time 1-on-One Messaging
- **WebSockets Engine**: Low-latency bi-directional messaging via FastAPI WebSocket ConnectionManager.
- **Delivery & Read Receipts**:
  - `✓` (Sent)
  - `✓✓` (Delivered - Gray)
  - `✓✓` (Read - Signature Signal Blue)
- **Typing Indicators**: Live "Bob is typing..." status bar.

### 4. 👥 Group Messaging & Admin Controls
- **Group Creation**: Custom group title, avatar, and multi-contact selection.
- **Member Management**:
  - View group member list with `Admin` / `Member` role badges.
  - Admin actions: Add member, Remove member.
  - Member actions: Leave group.
- **System Activity Log**: System message bubbles for group creation, member updates, and disappearing timer changes.

### 5. 🔒 Signal UX & Security Protocol Visuals
- **Encrypted Trust Banner**: `🔒 End-to-End Encrypted (Simulated Signal Protocol v3)`.
- **Disappearing Messages**: Set timer (5s, 30s, 1d, 1w, Off) with auto-expiration DB cleanup.
- **Audio & Video Call Overlay**: Authentic encrypted call overlay with duration timer and mute/video controls.
- **Settings Panel**: Profile, Appearance (Light/Dark mode toggle), Privacy, Notifications, Linked Devices (QR code scanner mock), and About info.

### 6. ⭐ Bonus Features
- 📷 **Attachments**: Image file uploads with in-chat thumbnail preview; file attachment download links.
- ❤️ **Message Reactions**: Hover emoji reaction bar (`❤️ 👍 😂 😮 😢`) with live pill counters.
- ↩️ **Quoted Replies**: Click reply on any message to quote snippet in chat bubble.
- 🌙 **Dark & Light Mode**: Signal Dark (`#121418`) and Signal Light styling.

---

## 🏗️ Technical Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Next.js 14 Frontend     │
                          │ (React, TypeScript, TW)   │
                          └─────────────┬─────────────┘
                                        │
                         HTTP REST      │    WebSocket (ws://)
                     /api/auth, /api/*  │   Real-time events
                                        ▼
                          ┌───────────────────────────┐
                          │    FastAPI Backend        │
                          │   Python 3.12 Server      │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │   SQLite Database         │
                          │     (signal.db)           │
                          └───────────────────────────┘
```

---

## 🗄️ Database Schema (SQLite)

```sql
User (id, username, phone, display_name, avatar_url, about, is_online, last_seen, created_at)
Contact (id, user_id, contact_user_id, nickname, created_at)
Conversation (id, type, name, avatar_url, disappearing_timer, created_by_id, created_at, updated_at)
ConversationParticipant (id, conversation_id, user_id, role, joined_at, last_read_message_id)
Message (id, conversation_id, sender_id, content, message_type, media_url, media_filename, reply_to_id, status, is_encrypted, expires_at, created_at)
MessageReaction (id, message_id, user_id, emoji, created_at)
MessageReceipt (id, message_id, user_id, status, updated_at)
```

---

## 🚀 Quick Start & Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Run Backend Server (FastAPI)
```bash
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed sample database (Alice, Bob, Charlie, Dana + group chats)
python seed.py

# Start FastAPI Uvicorn server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be live at `http://localhost:8000`.

### 2. Run Frontend Application (Next.js)
```bash
cd frontend

# Install npm dependencies
npm install

# Run development server
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🔑 Demo Credentials
You can click any quick login button on the login screen or enter these credentials:

| Display Name | Username | Phone Number | Role |
| :--- | :--- | :--- | :--- |
| **Alice Vance** | `alice` | `+15550101` | Dev Lead (Admin) |
| **Bob Smith** | `bob` | `+15550102` | Product Designer |
| **Charlie Brown** | `charlie` | `+15550103` | Security Researcher |
| **Dana Scully** | `dana` | `+15550104` | Systems Architect |

*Mock OTP code for all accounts:* `123456`
