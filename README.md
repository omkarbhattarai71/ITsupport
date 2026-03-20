# FCN IT Support - Equipment Booking & Asset Management System

A modern, full-stack web application for managing IT equipment requests and support tickets.

![FCN IT Support](https://img.shields.io/badge/FCN-IT%20Support-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Express](https://img.shields.io/badge/Express-4.x-green)
![Prisma](https://img.shields.io/badge/Prisma-5.x-purple)

## 🚀 Features

### For Users
- 📦 Browse IT equipment catalog
- 🛒 Request equipment with cart system
- 🎫 Create support tickets
- 🔔 Real-time notifications
- 📋 Track request history
- 👤 Profile management

### For Admins
- 📊 Dashboard with analytics
- ✅ Approve/decline requests
- 📦 Inventory management
- 🎫 Ticket resolution workflow
- 👥 User management
- 📝 Activity logs & auditing

## 🛠 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- lucide-react (icons)

**Backend:**
- Express.js
- TypeScript
- Prisma ORM
- SQLite (easily swappable to PostgreSQL)
- JWT Authentication

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Clone the repository

```bash
cd "c:\Users\OmkarBhattarai\OneDrive - FCN-RTD\Desktop\FCN Project"
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Set up the Database

```bash
# Generate Prisma client
npm run db:generate

# Create database and run migrations
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```
The API will be available at `http://localhost:3001`

### Start the Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```
The application will be available at `http://localhost:3000`

## 🔐 Demo Accounts

| Role  | Email           | Password  |
|-------|-----------------|-----------|
| Admin | admin@fcn.com   | admin123  |
| User  | user@fcn.com    | user123   |

## 📁 Project Structure

```
FCN Project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data
│   ├── src/
│   │   ├── index.ts         # Express server
│   │   ├── middleware/      # Auth middleware
│   │   └── routes/          # API routes
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   │   ├── (auth)/      # Login/Register
│   │   │   ├── dashboard/   # User portal
│   │   │   └── admin/       # Admin dashboard
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context
│   │   └── lib/             # Utilities
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Inventory
- `GET /api/inventory` - List all items
- `POST /api/inventory` - Create item (admin)
- `PUT /api/inventory/:id` - Update item (admin)
- `DELETE /api/inventory/:id` - Delete item (admin)

### Requests
- `POST /api/requests` - Create request
- `GET /api/requests` - Get user's requests
- `DELETE /api/requests/:id` - Cancel request

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get user's tickets

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/requests` - All requests
- `PUT /api/admin/requests/:id/status` - Update request status
- `GET /api/admin/tickets` - All tickets
- `PUT /api/admin/tickets/:id/status` - Update ticket status
- `GET /api/admin/logs` - Activity logs
- `GET /api/admin/users` - All users

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🎨 UI Features

- **Dark Mode Ready** - Built-in dark mode support
- **Glassmorphism** - Modern glass effects
- **Animations** - Smooth transitions and micro-interactions
- **Responsive** - Mobile-first design
- **Accessible** - Semantic HTML and ARIA labels

## 📝 License

MIT License - feel free to use this project for your own purposes.

---

Built with ❤️ by FCN IT Team
