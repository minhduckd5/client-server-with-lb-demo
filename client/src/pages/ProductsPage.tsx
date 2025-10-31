// Products page with full product catalog using API
import React from 'react';
import ProductGrid from '../components/ProductGrid';
import { useApp } from '../context/useApp';
import type { Product } from '../types';

const ProductsPage: React.FC = () => {
  const { state, addToCart } = useApp();
  const { products, loading, error } = state;

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product);
      // You could show a toast notification here
      console.log('Added to cart:', product);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error Loading Products</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Our Products</h1>
        <p>Discover our wide range of high-quality products</p>
      </div>
      
      <ProductGrid products={products} onAddToCart={handleAddToCart} />
    </div>
  );
};

export default ProductsPage;
