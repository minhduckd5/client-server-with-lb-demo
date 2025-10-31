// Order success page after successful checkout
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Home } from 'lucide-react';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const { orderId, total } = location.state || {};

  return (
    <div className="order-success-page">
      <div className="success-content">
        <CheckCircle size={64} className="success-icon" />
        <h1>Order Placed Successfully!</h1>
        <p>Thank you for your purchase. Your order has been confirmed.</p>
        
        {orderId && (
          <div className="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Total:</strong> ${total?.toFixed(2) || '0.00'}</p>
          </div>
        )}
        
        <div className="next-steps">
          <h3>What's Next?</h3>
          <div className="step">
            <Package size={24} />
            <div>
              <h4>Order Processing</h4>
              <p>We're preparing your items for shipment</p>
            </div>
          </div>
          <div className="step">
            <CheckCircle size={24} />
            <div>
              <h4>Shipping Confirmation</h4>
              <p>You'll receive tracking information via email</p>
            </div>
          </div>
        </div>
        
        <div className="action-buttons">
          <Link to="/" className="btn-primary">
            <Home size={20} />
            Continue Shopping
          </Link>
          <Link to="/orders" className="btn-secondary">
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

