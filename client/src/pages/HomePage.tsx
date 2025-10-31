// Home page with hero section and featured products
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, RotateCcw } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to ShopHub</h1>
          <p>Discover amazing products at unbeatable prices</p>
          <Link to="/products" className="cta-button">
            Shop Now <ArrowRight size={20} />
          </Link>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">
            <span>🛍️</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature">
          <Truck size={32} />
          <h3>Free Shipping</h3>
          <p>Free shipping on orders over $50</p>
        </div>
        <div className="feature">
          <Shield size={32} />
          <h3>Secure Payment</h3>
          <p>Your payment information is safe and secure</p>
        </div>
        <div className="feature">
          <RotateCcw size={32} />
          <h3>Easy Returns</h3>
          <p>30-day return policy on all items</p>
        </div>
      </section>

      {/* Featured Products Preview */}
      <section className="featured-products">
        <h2>Featured Products</h2>
        <div className="featured-grid">
          <div className="featured-item">
            <div className="featured-image">
              <span>📱</span>
            </div>
            <h3>Smartphone Pro</h3>
            <div className="rating">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} className="star filled" />
              ))}
            </div>
            <p className="price">$599.99</p>
          </div>
          <div className="featured-item">
            <div className="featured-image">
              <span>💻</span>
            </div>
            <h3>Laptop Ultra</h3>
            <div className="rating">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} className="star filled" />
              ))}
            </div>
            <p className="price">$1299.99</p>
          </div>
          <div className="featured-item">
            <div className="featured-image">
              <span>🎧</span>
            </div>
            <h3>Wireless Headphones</h3>
            <div className="rating">
              {Array.from({ length: 4 }, (_, i) => (
                <Star key={i} size={16} className="star filled" />
              ))}
              <Star size={16} className="star empty" />
            </div>
            <p className="price">$199.99</p>
          </div>
        </div>
        <Link to="/products" className="view-all-btn">
          View All Products <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
};

export default HomePage;

