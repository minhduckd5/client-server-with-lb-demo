// Enhanced server with shopping site API endpoints
// Database integration with PostgreSQL
import http from 'http';
import { URL } from 'url';
import express from 'express';
import pool from '../db/index.js';

const SERVER_HOST = process.env.SERVER_HOST || '0.0.0.0';
const SERVER_PORT = process.env.SERVER_PORT || 3001;

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to get session ID from request
function getSessionId(req) {
  return req.headers['x-session-id'] || 'default-session';
}

// Helper function to transform database product row to API format
function transformProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    description: row.description,
    image: row.image,
    category: row.category,
    inStock: row.in_stock,
    rating: parseFloat(row.rating)
  };
}


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
          try {
            const searchQuery = url.searchParams.get('q');
            let query = 'SELECT * FROM products ORDER BY name';
            let params = [];
            
            if (searchQuery) {
              query = `SELECT * FROM products 
                       WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1 
                       ORDER BY name`;
              params = [`%${searchQuery.toLowerCase()}%`];
            }
            
            const result = await pool.query(query, params);
            const products = result.rows.map(transformProduct);
            sendResponse(res, 200, products);
          } catch (error) {
            console.error('Error fetching products:', error);
            sendResponse(res, 500, { error: 'Failed to fetch products' });
          }
          return;
        }
        
        if (path.startsWith('/api/products/') && method === 'GET') {
          try {
            const productId = path.split('/')[3];
            const result = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
            
            if (result.rows.length > 0) {
              const product = transformProduct(result.rows[0]);
              sendResponse(res, 200, product);
            } else {
              sendResponse(res, 404, { error: 'Product not found' });
            }
          } catch (error) {
            console.error('Error fetching product:', error);
            sendResponse(res, 500, { error: 'Failed to fetch product' });
          }
          return;
        }
        
        // Cart endpoints
        if (path === '/api/cart' && method === 'GET') {
          try {
            const sessionId = getSessionId(req);
            const result = await pool.query(
              `SELECT ci.*, p.id, p.name, p.price, p.description, p.image, p.category, p.in_stock, p.rating
               FROM cart_items ci
               JOIN products p ON ci.product_id = p.id
               WHERE ci.session_id = $1`,
              [sessionId]
            );
            
            const cart = result.rows.map(row => ({
              product: transformProduct(row),
              quantity: row.quantity
            }));
            
            sendResponse(res, 200, cart);
          } catch (error) {
            console.error('Error fetching cart:', error);
            sendResponse(res, 500, { error: 'Failed to fetch cart' });
          }
          return;
        }
        
        if (path === '/api/cart' && method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { productId, quantity } = JSON.parse(body);
              const sessionId = getSessionId(req);
              
              // Check if product exists
              const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
              if (productResult.rows.length === 0) {
                sendResponse(res, 404, { error: 'Product not found' });
                return;
              }
              
              // Check if item already exists in cart
              const existingItem = await pool.query(
                'SELECT * FROM cart_items WHERE product_id = $1 AND session_id = $2',
                [productId, sessionId]
              );
              
              if (existingItem.rows.length > 0) {
                // Update quantity
                await pool.query(
                  'UPDATE cart_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND session_id = $3',
                  [quantity, productId, sessionId]
                );
              } else {
                // Insert new item
                await pool.query(
                  'INSERT INTO cart_items (product_id, quantity, session_id) VALUES ($1, $2, $3)',
                  [productId, quantity, sessionId]
                );
              }
              
              // Return updated cart
              const cartResult = await pool.query(
                `SELECT ci.*, p.id, p.name, p.price, p.description, p.image, p.category, p.in_stock, p.rating
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.id
                 WHERE ci.session_id = $1`,
                [sessionId]
              );
              
              const cart = cartResult.rows.map(row => ({
                product: transformProduct(row),
                quantity: row.quantity
              }));
              
              sendResponse(res, 200, cart);
            } catch (error) {
              console.error('Error adding to cart:', error);
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
          
          req.on('end', async () => {
            try {
              const { quantity } = JSON.parse(body);
              const sessionId = getSessionId(req);
              
              if (quantity <= 0) {
                // Remove item from cart
                await pool.query(
                  'DELETE FROM cart_items WHERE product_id = $1 AND session_id = $2',
                  [productId, sessionId]
                );
              } else {
                // Update quantity
                await pool.query(
                  'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND session_id = $3',
                  [quantity, productId, sessionId]
                );
              }
              
              // Return updated cart
              const cartResult = await pool.query(
                `SELECT ci.*, p.id, p.name, p.price, p.description, p.image, p.category, p.in_stock, p.rating
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.id
                 WHERE ci.session_id = $1`,
                [sessionId]
              );
              
              const cart = cartResult.rows.map(row => ({
                product: transformProduct(row),
                quantity: row.quantity
              }));
              
              sendResponse(res, 200, cart);
            } catch (error) {
              console.error('Error updating cart:', error);
              sendResponse(res, 400, { error: 'Invalid request body' });
            }
          });
          return;
        }
        
        if (path.startsWith('/api/cart/') && method === 'DELETE') {
          try {
            const productId = path.split('/')[3];
            const sessionId = getSessionId(req);
            
            await pool.query(
              'DELETE FROM cart_items WHERE product_id = $1 AND session_id = $2',
              [productId, sessionId]
            );
            
            // Return updated cart
            const cartResult = await pool.query(
              `SELECT ci.*, p.id, p.name, p.price, p.description, p.image, p.category, p.in_stock, p.rating
               FROM cart_items ci
               JOIN products p ON ci.product_id = p.id
               WHERE ci.session_id = $1`,
              [sessionId]
            );
            
            const cart = cartResult.rows.map(row => ({
              product: transformProduct(row),
              quantity: row.quantity
            }));
            
            sendResponse(res, 200, cart);
          } catch (error) {
            console.error('Error deleting cart item:', error);
            sendResponse(res, 500, { error: 'Failed to delete cart item' });
          }
          return;
        }
        
        if (path === '/api/cart' && method === 'DELETE') {
          try {
            const sessionId = getSessionId(req);
            await pool.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId]);
            sendResponse(res, 200, []);
          } catch (error) {
            console.error('Error clearing cart:', error);
            sendResponse(res, 500, { error: 'Failed to clear cart' });
          }
          return;
        }
        
        // Orders endpoints
        if (path === '/api/orders' && method === 'GET') {
          try {
            const result = await pool.query(
              'SELECT * FROM orders ORDER BY created_at DESC'
            );
            
            const orders = await Promise.all(result.rows.map(async (order) => {
              const itemsResult = await pool.query(
                'SELECT * FROM order_items WHERE order_id = $1',
                [order.id]
              );
              
              return {
                id: order.id,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                customerAddress: order.customer_address,
                customerPhone: order.customer_phone,
                status: order.status,
                totalAmount: parseFloat(order.total_amount),
                items: itemsResult.rows.map(item => ({
                  productId: item.product_id,
                  productName: item.product_name,
                  productPrice: parseFloat(item.product_price),
                  quantity: item.quantity,
                  subtotal: parseFloat(item.subtotal)
                })),
                createdAt: order.created_at.toISOString()
              };
            }));
            
            sendResponse(res, 200, orders);
          } catch (error) {
            console.error('Error fetching orders:', error);
            sendResponse(res, 500, { error: 'Failed to fetch orders' });
          }
          return;
        }
        
        if (path === '/api/orders' && method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const orderData = JSON.parse(body);
              const sessionId = getSessionId(req);
              
              // Get cart items
              const cartResult = await pool.query(
                `SELECT ci.product_id, ci.quantity, p.name, p.price
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.id
                 WHERE ci.session_id = $1`,
                [sessionId]
              );
              
              if (cartResult.rows.length === 0) {
                sendResponse(res, 400, { error: 'Cart is empty' });
                return;
              }
              
              // Calculate total
              let totalAmount = 0;
              cartResult.rows.forEach(item => {
                totalAmount += parseFloat(item.price) * item.quantity;
              });
              
              // Generate order ID
              const orderIdResult = await pool.query('SELECT COUNT(*) + 1 as next_id FROM orders');
              const orderId = `ORD-${orderIdResult.rows[0].next_id}`;
              
              // Create order
              await pool.query(
                `INSERT INTO orders (id, customer_name, customer_email, customer_address, customer_phone, status, total_amount)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  orderId,
                  orderData.customerName || null,
                  orderData.customerEmail || null,
                  orderData.customerAddress || null,
                  orderData.customerPhone || null,
                  'pending',
                  totalAmount
                ]
              );
              
              // Create order items
              for (const item of cartResult.rows) {
                const subtotal = parseFloat(item.price) * item.quantity;
                await pool.query(
                  `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [orderId, item.product_id, item.name, item.price, item.quantity, subtotal]
                );
              }
              
              // Clear cart
              await pool.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId]);
              
              // Fetch created order with items
              const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
              const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
              
              const order = {
                id: orderResult.rows[0].id,
                customerName: orderResult.rows[0].customer_name,
                customerEmail: orderResult.rows[0].customer_email,
                customerAddress: orderResult.rows[0].customer_address,
                customerPhone: orderResult.rows[0].customer_phone,
                status: orderResult.rows[0].status,
                totalAmount: parseFloat(orderResult.rows[0].total_amount),
                items: itemsResult.rows.map(item => ({
                  productId: item.product_id,
                  productName: item.product_name,
                  productPrice: parseFloat(item.product_price),
                  quantity: item.quantity,
                  subtotal: parseFloat(item.subtotal)
                })),
                createdAt: orderResult.rows[0].created_at.toISOString()
              };
              
              sendResponse(res, 201, order);
            } catch (error) {
              console.error('Error creating order:', error);
              sendResponse(res, 400, { error: 'Invalid request body' });
            }
          });
          return;
        }
        
        if (path.startsWith('/api/orders/') && method === 'GET') {
          try {
            const orderId = path.split('/')[3];
            const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            
            if (orderResult.rows.length === 0) {
              sendResponse(res, 404, { error: 'Order not found' });
              return;
            }
            
            const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
            
            const order = {
              id: orderResult.rows[0].id,
              customerName: orderResult.rows[0].customer_name,
              customerEmail: orderResult.rows[0].customer_email,
              customerAddress: orderResult.rows[0].customer_address,
              customerPhone: orderResult.rows[0].customer_phone,
              status: orderResult.rows[0].status,
              totalAmount: parseFloat(orderResult.rows[0].total_amount),
              items: itemsResult.rows.map(item => ({
                productId: item.product_id,
                productName: item.product_name,
                productPrice: parseFloat(item.product_price),
                quantity: item.quantity,
                subtotal: parseFloat(item.subtotal)
              })),
              createdAt: orderResult.rows[0].created_at.toISOString()
            };
            
            sendResponse(res, 200, order);
          } catch (error) {
            console.error('Error fetching order:', error);
            sendResponse(res, 500, { error: 'Failed to fetch order' });
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