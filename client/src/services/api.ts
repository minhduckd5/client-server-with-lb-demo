// API service for backend integration
import type { Product, CartItem, Order } from '../types';
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Types are sourced from '../types' to avoid duplication

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null as T,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Product endpoints
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/api/products');
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/api/products/${id}`);
  }

  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>(`/api/products/search?q=${encodeURIComponent(query)}`);
  }

  // Cart endpoints
  async getCart(): Promise<ApiResponse<CartItem[]>> {
    return this.request<CartItem[]>('/api/cart');
  }

  async addToCart(productId: string, quantity: number = 1): Promise<ApiResponse<CartItem[]>> {
    return this.request<CartItem[]>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: string, quantity: number): Promise<ApiResponse<CartItem[]>> {
    return this.request<CartItem[]>(`/api/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: string): Promise<ApiResponse<CartItem[]>> {
    return this.request<CartItem[]>(`/api/cart/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<ApiResponse<CartItem[]>> {
    return this.request<CartItem[]>('/api/cart', {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<ApiResponse<Order>> {
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.request<Order[]>('/api/orders');
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/api/health');
  }
}

export const apiService = new ApiService();
