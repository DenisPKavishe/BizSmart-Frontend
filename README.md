# BizSmart Frontend

A modern, type-safe frontend application built with TypeScript and Next.js for the BizSmart business intelligence platform.

## 🚀 Features

- **Type-Safe Development**: Built entirely in TypeScript for enhanced code quality and developer experience
- **Next.js Framework**: Latest Next.js 14 with App Router for optimal performance
- **Modern Architecture**: Leverages contemporary frontend patterns and best practices
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices with Tailwind CSS
- **State Management**: Zustand for lightweight, efficient state management
- **API Integration**: Axios for HTTP requests with JWT authentication
- **Form Handling**: React Hook Form for flexible form management
- **Data Visualization**: Recharts for beautiful, interactive charts
- **Notifications**: React Hot Toast for user feedback
- **Performance Optimized**: Efficient bundling and runtime performance

## 📋 Prerequisites

- Node.js v14+ (recommended v18+)
- npm, yarn, pnpm, or bun package manager
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DenisPKavishe/BizSmart-Frontend.git
   cd BizSmart-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

## 🚀 Getting Started

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The application will be available at `http://localhost:3000`.

### Production Build

Create an optimized production build:

```bash
npm run build
# or
yarn build
```

### Start Production Server

Run the production build:

```bash
npm start
# or
yarn start
```

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable React components
├── services/         # API and business logic services
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── styles/           # Global styles and theme
├── types/            # TypeScript type definitions
└── store/            # Zustand store configurations
```

## 📦 Dependencies

This project uses the following key dependencies:

- **next**: v14 - React framework
- **react**: UI library
- **react-dom**: React DOM rendering
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS framework
- **axios**: HTTP client for API requests
- **zustand**: Lightweight state management
- **jwt-decode**: JWT token decoding
- **react-hot-toast**: Toast notifications
- **react-hook-form**: Form state management
- **date-fns**: Date utilities
- **react-icons**: Icon library
- **recharts**: Data visualization charts

## 🔐 Authentication

This project uses JWT (JSON Web Tokens) for authentication. Tokens are decoded using `jwt-decode` and can be stored in browser storage or state management.

### Example API Request with Auth

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📊 API Endpoints

The frontend communicates with the BizSmart Backend API. Key endpoints include:

- `/api/v1/financials/budgets/` - Budget management
- `/api/v1/bi/dashboard/` - Business intelligence dashboard

## 🧪 Development Notes

### Running Backend Server

If developing with the BizSmart Backend, start the Django server:

```bash
python manage.py runserver 0.0.0.0:8000
```

### API Testing with cURL

Example budget creation request:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/financials/budgets/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "July 2026 Budget",
    "period": "monthly",
    "year": 2026,
    "month": 7,
    "status": "draft"
  }'
```

Example dashboard fetch:

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/bi/dashboard/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

## 🔍 Code Quality

### TypeScript

All code is written in TypeScript for type safety:

```bash
npm run type-check
```

### Linting

Maintain code quality with ESLint:

```bash
npm run lint
```

## 🎨 Styling

This project uses **Tailwind CSS** for styling. Configure your design system in `tailwind.config.ts`.

## 📚 Technologies

- **Language**: TypeScript (99.9%)
- **Framework**: Next.js 14
- **Runtime**: Node.js v14+
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Package Manager**: npm/yarn/pnpm/bun

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/DenisPKavishe/BizSmart-Frontend/issues)
- Contact the maintainer: [DenisPKavishe](https://github.com/DenisPKavishe)

## 🔗 Related Projects

- [BizSmart Backend](https://github.com/DenisPKavishe/BizSmart-Backend) - Backend API for BizSmart

---

**Happy coding! 🎉**
