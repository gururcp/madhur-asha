# Madhur Asha Enterprises - Business Management Portal

A full-stack business management portal with an intelligent GST (Goods and Services Tax) profit calculator designed for Indian businesses.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-24.x-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.9-blue.svg)

---

## 🎯 Features

### 📊 GST Profit Calculator
- Calculate profits with GST on purchases and sales
- Multiple expense entries with optional GST
- Commission calculations
- Real-time profit analysis
- Save calculations with labels and bill numbers

### 👥 Customer Management
- CRUD operations for customers
- GSTIN (GST Identification Number) tracking
- Address and contact information
- Calculation history per customer

### 🔐 User Access Control
- Google OAuth 2.0 authentication
- Three user roles:
  - **Admin**: Full access, user approval, all customers
  - **Customer Access**: Assigned customers only
  - **Calculator Only**: Calculator access, no data persistence
- User approval workflow

### 📈 Business Analytics
- Dashboard with key metrics
- Total customers and calculations
- Month-to-date net profit
- Recent calculations overview

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query v5
- **UI Components**: Radix UI + Custom Components
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 7
- **Form Handling**: React Hook Form + Zod

### Backend
- **Framework**: Express 5
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (Google OAuth)
- **Session**: express-session with PostgreSQL store
- **Validation**: Zod
- **Logging**: Pino
- **Build**: esbuild

### Architecture
- **Monorepo**: pnpm workspaces
- **Type Safety**: End-to-end TypeScript
- **API**: OpenAPI 3.1 specification
- **Code Generation**: Orval (React Query hooks + Zod schemas)

---

## 📁 Project Structure

```
madhur-asha-ledger/
├── artifacts/              # Deployable applications
│   ├── api-server/        # Express backend
│   └── madhur-asha/       # React frontend
├── lib/                   # Shared libraries
│   ├── api-spec/         # OpenAPI specification
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/          # Generated Zod schemas
│   └── db/               # Database schema (Drizzle ORM)
├── scripts/              # Utility scripts
├── render.yaml           # Render deployment config
├── vercel.json           # Vercel deployment config
├── .env.example          # Environment variables template
└── DEPLOYMENT.md         # Deployment guide
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v24.x or higher
- **pnpm**: v9.x or higher
- **PostgreSQL**: v14 or higher (local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/madhur-asha-ledger.git
   cd madhur-asha-ledger
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   - Database connection string
   - Google OAuth credentials
   - Session secret

4. **Set up database**
   ```bash
   cd lib/db
   pnpm run push
   cd ../..
   ```

5. **Start development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd artifacts/api-server
   pnpm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd artifacts/madhur-asha
   pnpm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

---

## 🔧 Development

### Available Scripts

**Root Level:**
```bash
pnpm install          # Install all dependencies
pnpm run build        # Build all packages
pnpm run typecheck    # Type check all packages
```

**Backend (artifacts/api-server):**
```bash
pnpm run dev          # Start dev server with hot reload
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run typecheck    # Type check
```

**Frontend (artifacts/madhur-asha):**
```bash
pnpm run dev          # Start dev server
pnpm run build        # Build for production
pnpm run serve        # Preview production build
pnpm run typecheck    # Type check
```

**Database (lib/db):**
```bash
pnpm run push         # Push schema changes to database
pnpm run push-force   # Force push (drops existing data)
pnpm run studio       # Open Drizzle Studio (database GUI)
```

### Code Generation

When you modify the OpenAPI spec:

```bash
cd lib/api-spec
pnpm run codegen
```

This generates:
- React Query hooks in `lib/api-client-react/src/generated/`
- Zod schemas in `lib/api-zod/src/generated/`

---

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Backend (Render):**
1. Push code to GitHub
2. Connect repository to Render
3. Render auto-detects `render.yaml`
4. Configure environment variables
5. Deploy!

**Frontend (Vercel):**
1. Connect repository to Vercel
2. Vercel auto-detects `vercel.json`
3. Set `VITE_API_URL` environment variable
4. Deploy!

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/madhur_asha

# Server
PORT=3000
NODE_ENV=development

# Session
SESSION_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```bash
# API URL
VITE_API_URL=http://localhost:3000
```

---

## 👥 User Roles

### Admin
- Full system access
- Approve/reject user registrations
- Manage all customers
- View all calculations
- Auto-approved on first login (hardcoded emails)

### Customer Access
- Access assigned customers only
- Create and save calculations
- View calculation history for assigned customers
- Requires admin approval

### Calculator Only
- Use calculator without saving
- No customer access
- No history access
- Requires admin approval

---

## 🔒 Security

- **Authentication**: Google OAuth 2.0
- **Session Management**: Secure, HTTP-only cookies
- **CORS**: Configured for specific origins
- **SQL Injection**: Protected by Drizzle ORM
- **XSS**: React's built-in protection
- **CSRF**: Session-based protection

---

## 📊 Database Schema

### Users
- Google OAuth profile
- Role and status
- Assigned customer IDs

### Customers
- Business information
- GSTIN
- Contact details

### Calculations
- Input values (purchase, sale, expenses)
- Calculated results
- Associated customer
- Timestamps

---

## 🧪 Testing

Currently, the project does not have automated tests. Recommended additions:

- **Unit Tests**: Jest/Vitest for business logic
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright/Cypress for user flows
- **Component Tests**: React Testing Library

---

## 🐛 Known Issues

1. **No pagination** - All data loaded at once (performance concern with large datasets)
2. **No rate limiting** - API endpoints not protected from abuse
3. **No email verification** - Users auto-created on Google login
4. **No audit logging** - No tracking of who changed what
5. **No data export** - Cannot export calculations to PDF/Excel

See [Project Analysis](docs/analysis.md) for complete list.

---

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core calculator functionality
- [x] Customer management
- [x] User authentication
- [x] Basic dashboard
- [x] Deployment configuration

### Phase 2 (Next)
- [ ] Add pagination
- [ ] Implement rate limiting
- [ ] Add unit tests
- [ ] Export to PDF/Excel
- [ ] Email notifications
- [ ] Audit logging

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Multi-currency support
- [ ] Invoice generation
- [ ] Payment tracking
- [ ] Inventory management

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use existing UI components
- Add JSDoc comments for complex functions
- Update OpenAPI spec for API changes
- Run `pnpm run typecheck` before committing

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **Manish Keche** - Admin & Owner
- **Guru** - Admin & Owner

---

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [TanStack Query](https://tanstack.com/query) - Data fetching library
- [Render](https://render.com/) - Hosting platform
- [Vercel](https://vercel.com/) - Frontend hosting

---

## 📞 Support

For support, email manishkeche26@gmail.com or create an issue in the repository.

---

## 📈 Status

- **Development**: Active
- **Production**: Ready for deployment
- **Version**: 0.0.0 (Pre-release)

---

**Made with ❤️ for Indian businesses**