// Core context primitives kept separate to satisfy Fast Refresh constraints
import React, { createContext } from 'react';
import type { Product, CartItem, Order } from '../types';

export interface AppState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  loading: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'UPDATE_CART_ITEM'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order };

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadProducts: () => Promise<void>;
  loadCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<Order>;
  loadOrders: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

