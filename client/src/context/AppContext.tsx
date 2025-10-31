// Global state management provider component (components-only export for Fast Refresh)
import React, { useReducer, useEffect } from 'react';
import type { Product, Order } from '../types';
import { apiService } from '../services/api';
import { AppContext, type AppContextType, type AppState, type AppAction } from './appContextCore';

const initialState: AppState = {
  products: [],
  cart: [],
  orders: [],
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'ADD_TO_CART':
      {
        const existingItem = state.cart.find(item => item.product.id === action.payload.product.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, action.payload],
      };
      }
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0),
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product.id !== action.payload),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };
    default:
      return state;
  }
}

 

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await apiService.getProducts();
      if (response.success) {
        dispatch({ type: 'SET_PRODUCTS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to load products' });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load products' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadCart = async () => {
    try {
      const response = await apiService.getCart();
      if (response.success) {
        dispatch({ type: 'SET_CART', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      const response = await apiService.addToCart(product.id, quantity);
      if (response.success) {
        dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    try {
      const response = await apiService.updateCartItem(productId, quantity);
      if (response.success) {
        dispatch({ type: 'UPDATE_CART_ITEM', payload: { productId, quantity } });
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const response = await apiService.removeFromCart(productId);
      if (response.success) {
        dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await apiService.clearCart();
      if (response.success) {
        dispatch({ type: 'CLEAR_CART' });
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
    try {
      const response = await apiService.createOrder(orderData);
      if (response.success) {
        dispatch({ type: 'ADD_ORDER', payload: response.data });
        dispatch({ type: 'CLEAR_CART' });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };

  const loadOrders = async () => {
    try {
      const response = await apiService.getOrders();
      if (response.success) {
        dispatch({ type: 'SET_ORDERS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    loadProducts,
    loadCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    createOrder,
    loadOrders,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};


