// Header component with navigation and cart icon
import React, { useState } from 'react';
import { ShoppingCart, User, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  cartItemCount: number;
}

const Header: React.FC<HeaderProps> = ({ cartItemCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>ShopHub</h1>
        </Link>

        <button
          className="mobile-menu-button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="mobile-menu-bar" />
          <span className="mobile-menu-bar" />
          <span className="mobile-menu-bar" />
        </button>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/products" className="nav-link" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link to="/about" className="nav-link" onClick={() => setMenuOpen(false)}>About</Link>
        </nav>

        <div className={`header-actions ${menuOpen ? 'open' : ''}`}>
          <div className="search-bar">
            <Search className="search-icon" />
            <input type="text" placeholder="Search products..." className="search-input" />
          </div>

          <Link to="/cart" className="cart-link" onClick={() => setMenuOpen(false)}>
            <ShoppingCart className="cart-icon" />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </Link>

          <Link to="/profile" className="profile-link" onClick={() => setMenuOpen(false)}>
            <User className="profile-icon" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

