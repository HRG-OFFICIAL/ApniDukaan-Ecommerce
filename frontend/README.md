# ApniDukaan E-commerce Frontend

A modern, full-featured e-commerce frontend built with Next.js 14, TypeScript, Tailwind CSS, and Zustand for state management.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3-blue)

## ✨ Features

### 🛍️ Complete E-commerce Functionality
- **Product Catalog**: Browse, search, filter, and sort products
- **Shopping Cart**: Add/remove items, quantity management, persistent cart
- **User Authentication**: Login, registration, password reset
- **Checkout Process**: Multi-step checkout with address and payment forms
- **Order Management**: Order history, tracking, and status updates
- **User Dashboard**: Profile management, order history, wishlist
- **Admin Dashboard**: Product and order management interface

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Library**: Reusable UI components (buttons, modals, forms)
- **Loading States**: Skeleton loaders and loading spinners
- **Error Handling**: Global error boundary and user-friendly messages
- **Toast Notifications**: Success/error notifications with react-hot-toast

### ⚡ Performance & Developer Experience
- **Next.js 14**: App Router, Server Components, optimized builds
- **TypeScript**: Full type safety and enhanced developer experience
- **State Management**: Zustand for lightweight, scalable state management
- **Code Quality**: ESLint, TypeScript checking, and build optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apnidukaan-ecommerce/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router pages
│   ├── page.tsx           # Homepage
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout process
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   └── account/           # User dashboard
├── components/            # Reusable components
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   └── ProductCard.tsx    # Product-specific components
├── store/                 # Zustand state management
│   ├── useAuthStore.ts    # Authentication state
│   ├── useCartStore.ts    # Shopping cart state
│   ├── useProductsStore.ts # Product catalog state
│   └── useAppStore.ts     # Global app state
├── utils/                 # Utility functions
│   ├── validation.ts      # Form validation helpers
│   ├── formatting.ts      # Data formatting utilities
│   └── constants.ts       # App constants
├── graphql/              # GraphQL types and queries
└── styles/               # Global styles and Tailwind config
```

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checking
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Netlify

1. **Build command**: `npm run build`
2. **Publish directory**: `.next`
3. **Configure environment variables**
4. **Deploy**

### Docker Deployment

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | Backend GraphQL API URL | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key for payments | Yes |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics tracking ID | No |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | No |

### Tailwind CSS Customization

Customize design tokens in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

## 📊 State Management

The application uses Zustand for state management with the following stores:

### Auth Store (`useAuthStore`)
- User authentication status
- User profile information
- Login/logout functionality
- Token management

### Cart Store (`useCartStore`)
- Shopping cart items
- Cart calculations (subtotal, tax, shipping)
- Add/remove/update cart items
- Persistent cart storage

### Products Store (`useProductsStore`)
- Product catalog
- Search and filtering
- Product details
- Categories and pagination

### App Store (`useAppStore`)
- Global UI state
- Toast notifications
- Modal management
- Loading states

## 🧪 Testing

The project includes Jest and React Testing Library for testing:

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

### Testing Strategy
- **Unit Tests**: Individual components and utilities
- **Integration Tests**: User flows and interactions
- **E2E Tests**: Critical user journeys (planned)

## 🔒 Security

- **Input Validation**: All forms include client-side validation
- **XSS Protection**: Next.js built-in protections
- **CSRF Protection**: Implemented in API integration
- **Secure Headers**: Configured in `next.config.js`

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Use `npm run analyze` to analyze bundles
- **Static Generation**: Pre-rendered pages where possible
- **Caching**: Optimal caching strategies implemented

## 📱 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Responsive**: Supports screens from 320px to 4K

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**TypeScript Errors**
```bash
# Run type checking
npm run type-check
```

**Styling Issues**
```bash
# Rebuild Tailwind
npm run build:css
```

### Getting Help
- Check the [Issues](https://github.com/your-repo/issues) section
- Review the [Documentation](./docs/)
- Contact the development team

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Follow the existing code style
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- **Next.js** - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Lucide React** - Icon library
- **React Hook Form** - Form handling

---

**Built with ❤️ by the ApniDukaan Team**
