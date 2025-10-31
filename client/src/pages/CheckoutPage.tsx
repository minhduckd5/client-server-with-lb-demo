// Checkout page with order form using context
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm';
import type { OrderData } from '../components/CheckoutForm';
import { useApp } from '../context/useApp';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, createOrder } = useApp();
  const { cart } = state;
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleOrderSubmit = async (orderData: OrderData) => {
    setIsProcessing(true);
    
    try {
      const order = await createOrder({
        items: cart,
        total,
        customerInfo: orderData.customerInfo,
        shippingAddress: orderData.shippingAddress,
      });
      
      // Navigate to success page
      navigate('/order-success', { 
        state: { 
          orderId: order.id,
          total: total
        }
      });
    } catch (error) {
      console.error('Order submission failed:', error);
      // Handle error (show error message, etc.)
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart-checkout">
        <h1>Your cart is empty</h1>
        <p>Add some products to your cart before checking out.</p>
        <button onClick={() => navigate('/products')} className="shop-now-btn">
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Complete your order</p>
      </div>
      
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner"></div>
          <p>Processing your order...</p>
        </div>
      )}
      
      <CheckoutForm
        items={cart}
        total={total}
        onSubmit={handleOrderSubmit}
      />
    </div>
  );
};

export default CheckoutPage;
