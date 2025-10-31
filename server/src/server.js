// Enhanced server with shopping site API endpoints
import http from 'http';
import { URL } from 'url';

const SERVER_HOST = process.env.SERVER_HOST || '0.0.0.0';
const SERVER_PORT = process.env.SERVER_PORT || 3001;

// Mock data for the shopping site
const products = [
  {
    id: '1',
    name: 'Smartphone Pro',
    price: 599.99,
    description: 'Latest smartphone with advanced camera and performance',
    image: 'https://via.placeholder.com/300x300?text=Smartphone',
    category: 'Electronics',
    inStock: true,
    rating: 5
  },
  {
    id: '2',
    name: 'Laptop Ultra',
    price: 1299.99,
    description: 'High-performance laptop for professionals',
    image: 'https://via.placeholder.com/300x300?text=Laptop',
    category: 'Electronics',
    inStock: true,
    rating: 5
  },
  {
    id: '3',
    name: 'Wireless Headphones',
    price: 199.99,
    description: 'Premium noise-canceling wireless headphones',
    image: 'https://via.placeholder.com/300x300?text=Headphones',
    category: 'Electronics',
    inStock: true,
    rating: 4
  },
  {
    id: '4',
    name: 'Smart Watch',
    price: 299.99,
    description: 'Fitness tracking smartwatch with health monitoring',
    image: 'https://via.placeholder.com/300x300?text=Smart+Watch',
    category: 'Electronics',
    inStock: true,
    rating: 4
  },
  {
    id: '5',
    name: 'Coffee Maker',
    price: 89.99,
    description: 'Automatic coffee maker with programmable features',
    image: 'https://via.placeholder.com/300x300?text=Coffee+Maker',
    category: 'Home',
    inStock: true,
    rating: 4
  },
  {
    id: '6',
    name: 'Running Shoes',
    price: 129.99,
    description: 'Comfortable running shoes for all terrains',
    image: 'https://via.placeholder.com/300x300?text=Running+Shoes',
    category: 'Sports',
    inStock: true,
    rating: 5
  },
  {
    id: '7',
    name: 'Backpack',
    price: 79.99,
    description: 'Durable backpack for travel and daily use',
    image: 'https://via.placeholder.com/300x300?text=Backpack',
    category: 'Accessories',
    inStock: false,
    rating: 4
  },
  {
    id: '8',
    name: 'Bluetooth Speaker',
    price: 149.99,
    description: 'Portable Bluetooth speaker with excellent sound quality',
    image: 'https://via.placeholder.com/300x300?text=Speaker',
    category: 'Electronics',
    inStock: true,
    rating: 4
  }
];

// In-memory storage for demo purposes
let cart = [];
let orders = [];
let orderIdCounter = 1;

function sendResponse(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

function handleCORS(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return true;
  }
  return false;
}

async function main() {
  try {
    const server = http.createServer();
    
    server.on('request', async (req, res) => {
      // Handle CORS
      if (handleCORS(req, res)) return;
      
      const url = new URL(req.url, `http://${req.headers.host}`);
      const path = url.pathname;
      const method = req.method;
      
      try {
        // Health check endpoint
        if (path === '/api/health') {
          sendResponse(res, 200, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            server: `${SERVER_HOST}:${SERVER_PORT}`
          });
          return;
        }
        
        // Products endpoints
        if (path === '/api/products' && method === 'GET') {
          const searchQuery = url.searchParams.get('q');
          let filteredProducts = products;
          
          if (searchQuery) {
            filteredProducts = products.filter(product =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          
          sendResponse(res, 200, filteredProducts);
          return;
        }
        
        if (path.startsWith('/api/products/') && method === 'GET') {
          const productId = path.split('/')[3];
          const product = products.find(p => p.id === productId);
          
          if (product) {
            sendResponse(res, 200, product);
          } else {
            sendResponse(res, 404, { error: 'Product not found' });
          }
          return;
        }
        
        // Cart endpoints
        if (path === '/api/cart' && method === 'GET') {
          sendResponse(res, 200, cart);
          return;
        }
        
        if (path === '/api/cart' && method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            try {
              const { productId, quantity } = JSON.parse(body);
              const product = products.find(p => p.id === productId);
              
              if (!product) {
                sendResponse(res, 404, { error: 'Product not found' });
                return;
              }
              
              const existingItem = cart.find(item => item.product.id === productId);
              if (existingItem) {
                existingItem.quantity += quantity;
              } else {
                cart.push({ product, quantity });
              }
              
              sendResponse(res, 200, cart);
            } catch (error) {
              sendResponse(res, 400, { error: 'Invalid request body' });
            }
          });
          return;
        }
        
        if (path.startsWith('/api/cart/') && method === 'PUT') {
          const productId = path.split('/')[3];
          let body = '';
          
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            try {
              const { quantity } = JSON.parse(body);
              const item = cart.find(item => item.product.id === productId);
              
              if (item) {
                item.quantity = quantity;
                if (item.quantity <= 0) {
                  cart = cart.filter(item => item.product.id !== productId);
                }
              }
              
              sendResponse(res, 200, cart);
            } catch (error) {
              sendResponse(res, 400, { error: 'Invalid request body' });
            }
          });
          return;
        }
        
        if (path.startsWith('/api/cart/') && method === 'DELETE') {
          const productId = path.split('/')[3];
          cart = cart.filter(item => item.product.id !== productId);
          sendResponse(res, 200, cart);
          return;
        }
        
        if (path === '/api/cart' && method === 'DELETE') {
          cart = [];
          sendResponse(res, 200, cart);
          return;
        }
        
        // Orders endpoints
        if (path === '/api/orders' && method === 'GET') {
          sendResponse(res, 200, orders);
          return;
        }
        
        if (path === '/api/orders' && method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            try {
              const orderData = JSON.parse(body);
              const order = {
                id: `ORD-${orderIdCounter++}`,
                ...orderData,
                status: 'pending',
                createdAt: new Date().toISOString()
              };
              
              orders.push(order);
              cart = []; // Clear cart after order
              
              sendResponse(res, 201, order);
            } catch (error) {
              sendResponse(res, 400, { error: 'Invalid request body' });
            }
          });
          return;
        }
        
        if (path.startsWith('/api/orders/') && method === 'GET') {
          const orderId = path.split('/')[3];
          const order = orders.find(o => o.id === orderId);
          
          if (order) {
            sendResponse(res, 200, order);
          } else {
            sendResponse(res, 404, { error: 'Order not found' });
          }
          return;
        }
        
        // Default response
        sendResponse(res, 404, { error: 'Endpoint not found' });
        
      } catch (error) {
        console.error('Request processing error:', error);
        sendResponse(res, 500, { error: 'Internal server error' });
      }
    });
    
    server.listen(SERVER_PORT, SERVER_HOST, () => {
      console.log(`Shopping site server is running on http://${SERVER_HOST}:${SERVER_PORT}`);
      console.log('Available endpoints:');
      console.log('  GET  /api/health - Health check');
      console.log('  GET  /api/products - Get all products');
      console.log('  GET  /api/products/:id - Get product by ID');
      console.log('  GET  /api/cart - Get cart items');
      console.log('  POST /api/cart - Add item to cart');
      console.log('  PUT  /api/cart/:id - Update cart item');
      console.log('  DELETE /api/cart/:id - Remove item from cart');
      console.log('  DELETE /api/cart - Clear cart');
      console.log('  GET  /api/orders - Get all orders');
      console.log('  POST /api/orders - Create order');
      console.log('  GET  /api/orders/:id - Get order by ID');
    });
    
  } catch (error) {
    console.error('Server startup error:', error);
  }
}

main()
  .then(() => console.log('Server initialization complete'))
  .catch(err => console.error('Server startup failed:', err));