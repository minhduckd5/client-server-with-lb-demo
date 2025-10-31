// Cart page with shopping cart functionality using context
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ShoppingCart from '../components/ShoppingCart';
import { useApp } from '../context/useApp';

const CartPage: React.FC = () => {
  const { state, updateCartItem, removeFromCart, clearCart, loadCart } = useApp();
  const { cart } = state;

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      await updateCartItem(productId, quantity);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1>Shopping Cart</h1>
        <Link to="/products" className="continue-shopping">
          Continue Shopping
        </Link>
      </div>
      
      <ShoppingCart
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
};

export default CartPage;
