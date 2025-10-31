// Shopping cart component with item management
import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { type CartItem } from '../types';

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <ShoppingBag size={64} className="empty-cart-icon" />
        <h2>Your cart is empty</h2>
        <p>Add some products to get started!</p>
      </div>
    );
  }

  return (
    <div className="shopping-cart">
      <div className="cart-header">
        <h2>Shopping Cart ({totalItems} items)</h2>
        <button onClick={onClearCart} className="clear-cart-btn">
          Clear Cart
        </button>
      </div>
      
      <div className="cart-items">
        {items.map(item => (
          <div key={item.product.id} className="cart-item">
            <div className="item-image">
              <img src={item.product.image} alt={item.product.name} />
            </div>
            
            <div className="item-details">
              <h3 className="item-name">{item.product.name}</h3>
              <p className="item-price">${item.product.price.toFixed(2)}</p>
            </div>
            
            <div className="item-quantity">
              <button
                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="quantity-btn"
              >
                <Minus size={16} />
              </button>
              <span className="quantity">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                className="quantity-btn"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="item-total">
              ${(item.product.price * item.quantity).toFixed(2)}
            </div>
            
            <button
              onClick={() => onRemoveItem(item.product.id)}
              className="remove-btn"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping:</span>
          <span>Free</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        
        <button className="checkout-btn">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default ShoppingCart;

