<!-- --- START MODIFICATION: Load Balancer usage section injected at top -->

## Using the Client with the nginx Load Balancer

This client is designed to call the backend via an nginx reverse proxy/load balancer defined in `docker-compose.yml`.

1) Configure the load balancer environment (at repo root):

```env
# .env (root next to docker-compose.yml)
SERVER_HOST_1=server1
SERVER_PORT_1=3001
SERVER_HOST_2=server2
SERVER_PORT_2=3002
SERVER_HOST_3=server3
SERVER_PORT_3=3003

NGINX_HOST=reverse-proxy
NGINX_PORT=8080
```

2) Start the backend pool and nginx:

```bash
docker compose up -d --build
```

3) Point the client to the load balancer:

```env
# client/.env
VITE_API_URL=http://localhost:8080
```

4) Run the client:

```bash
cd client
pnpm install
pnpm dev
```

5) Validate traffic is balanced:
- Hit `http://localhost:8080/api/health` multiple times; the `server` field will show which backend instance responded (e.g., `server1:3001`, `server2:3002`).

Notes:
- The nginx upstream is configured via `reverse-proxy/default.conf.template`. Weighting can be adjusted there.
- The compose file maps `${NGINX_PORT}` to the host, so you can change the external port via `.env`.

<!-- --- END MODIFICATION -->

# ShopHub - Modern Shopping Site Frontend

A modern, responsive shopping site built with React, TypeScript, and Vite, designed to work with a client-server architecture including nginx load balancer.

## Features

### 🛍️ **Core Shopping Features**
- **Product Catalog**: Browse products with filtering, sorting, and search
- **Shopping Cart**: Add/remove items, update quantities, persistent cart state
- **Checkout Process**: Complete order form with validation
- **Order Management**: Order confirmation and tracking

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Modern Styling**: Clean, professional design with smooth animations
- **Interactive Components**: Hover effects, loading states, form validation
- **Accessibility**: Semantic HTML and keyboard navigation support

### 🏗️ **Technical Architecture**
- **React 19**: Latest React features with hooks and context
- **TypeScript**: Full type safety throughout the application
- **React Router**: Client-side routing with navigation
- **Context API**: Global state management for cart and products
- **API Integration**: RESTful API communication with backend
- **Component Architecture**: Reusable, modular components

## Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx      # Navigation header with cart
│   │   ├── ProductCard.tsx # Individual product display
│   │   ├── ProductGrid.tsx # Product catalog with filters
│   │   ├── ShoppingCart.tsx # Cart management
│   │   └── CheckoutForm.tsx # Order form with validation
│   ├── pages/              # Route components
│   │   ├── HomePage.tsx    # Landing page with hero section
│   │   ├── ProductsPage.tsx # Product catalog page
│   │   ├── CartPage.tsx    # Shopping cart page
│   │   ├── CheckoutPage.tsx # Checkout process
│   │   └── OrderSuccessPage.tsx # Order confirmation
│   ├── context/            # Global state management
│   │   └── AppContext.tsx  # React context for app state
│   ├── services/           # API integration
│   │   └── api.ts         # Backend API service
│   ├── types/             # TypeScript definitions
│   │   └── index.ts       # Type definitions
│   ├── App.tsx            # Main app component
│   ├── App.css            # Global styles
│   └── main.tsx           # Application entry point
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Install dependencies:**
   ```bash
   cd client
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Build for production:**
   ```bash
   pnpm build
   ```

### Environment Configuration

Create a `.env` file in the client directory:

```env
VITE_API_URL=http://localhost:3001
```

## API Integration

The frontend communicates with the backend through a comprehensive API service:

### Endpoints
- `GET /api/products` - Fetch all products
- `GET /api/products/:id` - Get specific product
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove cart item
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get order history

### State Management

The application uses React Context for global state management:

- **Products**: Product catalog and search results
- **Cart**: Shopping cart items and quantities
- **Orders**: Order history and status
- **Loading States**: API request status
- **Error Handling**: User-friendly error messages

## Component Architecture

### Core Components

1. **Header**: Navigation with search, cart icon, and user menu
2. **ProductCard**: Individual product display with add to cart
3. **ProductGrid**: Product catalog with filtering and sorting
4. **ShoppingCart**: Cart management with quantity controls
5. **CheckoutForm**: Order form with validation

### Page Components

1. **HomePage**: Landing page with hero section and featured products
2. **ProductsPage**: Full product catalog with search and filters
3. **CartPage**: Shopping cart management
4. **CheckoutPage**: Order completion process
5. **OrderSuccessPage**: Order confirmation and next steps

## Styling and Design

### Design System
- **Color Palette**: Professional blue and gray tones
- **Typography**: Inter font family for modern readability
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle elevation for depth and hierarchy

### Responsive Breakpoints
- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: > 768px

### Key Features
- **Grid Layouts**: CSS Grid for product catalogs
- **Flexbox**: Flexible component layouts
- **Animations**: Smooth transitions and hover effects
- **Loading States**: Spinner and skeleton components

## Development

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Component Structure**: Consistent prop interfaces
- **Error Boundaries**: Graceful error handling

### Performance
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Optimized Images**: Responsive image handling
- **Bundle Analysis**: Vite build optimization

## Deployment

### Production Build
```bash
pnpm build
```

### Docker Support
The application is designed to work with Docker containers and nginx load balancing.

### Environment Variables
- `VITE_API_URL`: Backend API URL
- `VITE_APP_NAME`: Application name
- `VITE_APP_VERSION`: Application version

## Integration with Backend

The frontend is designed to work seamlessly with the Node.js backend server:

1. **CORS Support**: Backend configured for cross-origin requests
2. **API Consistency**: RESTful API design
3. **Error Handling**: Consistent error response format
4. **Data Validation**: Frontend and backend validation

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Responsive Design**: All screen sizes supported

## Future Enhancements

- **User Authentication**: Login and registration
- **Product Reviews**: Customer feedback system
- **Wishlist**: Save products for later
- **Payment Integration**: Stripe/PayPal integration
- **Admin Dashboard**: Product and order management
- **PWA Features**: Offline support and app-like experience

## Contributing

1. Follow TypeScript best practices
2. Use consistent component structure
3. Add proper error handling
4. Write meaningful commit messages
5. Test on multiple devices and browsers

## License

This project is part of a client-server architecture demonstration and is intended for educational purposes.