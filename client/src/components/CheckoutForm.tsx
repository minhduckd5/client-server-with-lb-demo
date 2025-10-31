// Checkout form component with validation
import React, { useState } from 'react';
import { CreditCard, MapPin, User } from 'lucide-react';
import { type CartItem } from '../types';

interface CheckoutFormProps {
  items: CartItem[];
  total: number;
  onSubmit: (orderData: OrderData) => void;
}

export interface OrderData {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    nameOnCard: string;
  };
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ items, total, onSubmit }) => {
  const [formData, setFormData] = useState<OrderData>({
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    paymentMethod: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      nameOnCard: ''
    }
  });

  const [errors, setErrors] = useState<Partial<OrderData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<OrderData> = {};

    // Customer info validation
    if (!formData.customerInfo.firstName) {
      newErrors.customerInfo = { ...newErrors.customerInfo, firstName: 'First name is required' } as Partial<OrderData>['customerInfo'];
    }
    if (!formData.customerInfo.lastName) {
      newErrors.customerInfo = { ...newErrors.customerInfo, lastName: 'Last name is required' } as Partial<OrderData>['customerInfo'];
    }
    if (!formData.customerInfo.email || !/\S+@\S+\.\S+/.test(formData.customerInfo.email)) {
      newErrors.customerInfo = { ...newErrors.customerInfo, email: 'Valid email is required' } as Partial<OrderData>['customerInfo'];
    }

    // Shipping address validation
    if (!formData.shippingAddress.street) {
      newErrors.shippingAddress = { ...newErrors.shippingAddress, street: 'Street address is required' } as Partial<OrderData>['shippingAddress'];
    }
    if (!formData.shippingAddress.city) {
      newErrors.shippingAddress = { ...newErrors.shippingAddress, city: 'City is required' } as Partial<OrderData>['shippingAddress'];
    }
    if (!formData.shippingAddress.zipCode) {
      newErrors.shippingAddress = { ...newErrors.shippingAddress, zipCode: 'ZIP code is required' } as Partial<OrderData>['shippingAddress'];
    }

    // Payment validation
    if (!formData.paymentMethod.cardNumber || formData.paymentMethod.cardNumber.length < 16) {
      newErrors.paymentMethod = { ...newErrors.paymentMethod, cardNumber: 'Valid card number is required' } as Partial<OrderData>['paymentMethod'];
    }
    if (!formData.paymentMethod.cvv || formData.paymentMethod.cvv.length < 3) {
      newErrors.paymentMethod = { ...newErrors.paymentMethod, cvv: 'Valid CVV is required' } as Partial<OrderData>['paymentMethod'] ;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (section: keyof OrderData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="checkout-form">
      <h2>Checkout</h2>
      
      <form onSubmit={handleSubmit} className="checkout-form-content">
        <div className="form-section">
          <h3><User size={20} /> Customer Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.customerInfo.firstName}
                onChange={(e) => updateField('customerInfo', 'firstName', e.target.value)}
                className={errors.customerInfo?.firstName ? 'error' : ''}
              />
              {errors.customerInfo?.firstName && (
                <span className="error-message">{errors.customerInfo.firstName}</span>
              )}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.customerInfo.lastName}
                onChange={(e) => updateField('customerInfo', 'lastName', e.target.value)}
                className={errors.customerInfo?.lastName ? 'error' : ''}
              />
              {errors.customerInfo?.lastName && (
                <span className="error-message">{errors.customerInfo.lastName}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.customerInfo.email}
                onChange={(e) => updateField('customerInfo', 'email', e.target.value)}
                className={errors.customerInfo?.email ? 'error' : ''}
              />
              {errors.customerInfo?.email && (
                <span className="error-message">{errors.customerInfo.email}</span>
              )}
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.customerInfo.phone}
                onChange={(e) => updateField('customerInfo', 'phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><MapPin size={20} /> Shipping Address</h3>
          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              value={formData.shippingAddress.street}
              onChange={(e) => updateField('shippingAddress', 'street', e.target.value)}
              className={errors.shippingAddress?.street ? 'error' : ''}
            />
            {errors.shippingAddress?.street && (
              <span className="error-message">{errors.shippingAddress.street}</span>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.shippingAddress.city}
                onChange={(e) => updateField('shippingAddress', 'city', e.target.value)}
                className={errors.shippingAddress?.city ? 'error' : ''}
              />
              {errors.shippingAddress?.city && (
                <span className="error-message">{errors.shippingAddress.city}</span>
              )}
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={formData.shippingAddress.state}
                onChange={(e) => updateField('shippingAddress', 'state', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input
                type="text"
                value={formData.shippingAddress.zipCode}
                onChange={(e) => updateField('shippingAddress', 'zipCode', e.target.value)}
                className={errors.shippingAddress?.zipCode ? 'error' : ''}
              />
              {errors.shippingAddress?.zipCode && (
                <span className="error-message">{errors.shippingAddress.zipCode}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><CreditCard size={20} /> Payment Information</h3>
          <div className="form-group">
            <label>Name on Card</label>
            <input
              type="text"
              value={formData.paymentMethod.nameOnCard}
              onChange={(e) => updateField('paymentMethod', 'nameOnCard', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Card Number</label>
            <input
              type="text"
              value={formData.paymentMethod.cardNumber}
              onChange={(e) => updateField('paymentMethod', 'cardNumber', e.target.value)}
              className={errors.paymentMethod?.cardNumber ? 'error' : ''}
              placeholder="1234 5678 9012 3456"
            />
            {errors.paymentMethod?.cardNumber && (
              <span className="error-message">{errors.paymentMethod.cardNumber}</span>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry Date</label>
              <input
                type="text"
                value={formData.paymentMethod.expiryDate}
                onChange={(e) => updateField('paymentMethod', 'expiryDate', e.target.value)}
                placeholder="MM/YY"
              />
            </div>
            <div className="form-group">
              <label>CVV</label>
              <input
                type="text"
                value={formData.paymentMethod.cvv}
                onChange={(e) => updateField('paymentMethod', 'cvv', e.target.value)}
                className={errors.paymentMethod?.cvv ? 'error' : ''}
                placeholder="123"
              />
              {errors.paymentMethod?.cvv && (
                <span className="error-message">{errors.paymentMethod.cvv}</span>
              )}
            </div>
          </div>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          {items.map(item => (
            <div key={item.product.id} className="order-item">
              <span>{item.product.name} x {item.quantity}</span>
              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="order-total">
            <span>Total: ${total.toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" className="submit-order-btn">
          Place Order
        </button>
      </form>
    </div>
  );
};

export default CheckoutForm;

