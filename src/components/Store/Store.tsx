// src/components/Store/Store.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  ChevronDown,
  X,
  Tag,
  Truck,
  Package,
  Plus,
  Minus
} from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  variants?: {
    type: string;
    options: string[];
  }[];
  inStock: boolean;
  shipping: {
    free: boolean;
    estimate: string;
  };
  memberDiscount?: {
    tier: 'basic' | 'premium' | 'allAccess';
    percentage: number;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
  variants?: Record<string, string>;
}

export default function Store() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-low' | 'price-high'>('popular');

  const categories = ['All', 'Merchandise', 'Digital', 'Limited Edition'];

  // Demo products data
  const products: Product[] = [
    {
      id: '1',
      name: 'Premium Workshop Bundle',
      description: 'Complete set of workshop materials and resources.',
      price: 99.99,
      images: ['/api/placeholder/400/400?text=Workshop+Bundle'],
      category: 'Digital',
      inStock: true,
      shipping: {
        free: true,
        estimate: 'Instant Download'
      },
      memberDiscount: {
        tier: 'premium',
        percentage: 20
      }
    },
    {
      id: '2',
      name: 'Limited Edition T-Shirt',
      description: 'Exclusive design, premium quality cotton.',
      price: 29.99,
      images: ['/api/placeholder/400/400?text=T-Shirt'],
      category: 'Merchandise',
      variants: [
        {
          type: 'Size',
          options: ['S', 'M', 'L', 'XL']
        },
        {
          type: 'Color',
          options: ['Black', 'White', 'Navy']
        }
      ],
      inStock: true,
      shipping: {
        free: false,
        estimate: '3-5 business days'
      },
      memberDiscount: {
        tier: 'basic',
        percentage: 10
      }
    },
    // Add more products as needed...
  ];

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return -1; // Demo sorting
      default:
        return 0;
    }
  });

  const calculateDiscountedPrice = (product: Product) => {
    if (!product.memberDiscount || !user?.membershipTier) {
      return product.price;
    }

    const tierLevels = { basic: 1, premium: 2, allAccess: 3 };
    const userTierLevel = tierLevels[user.membershipTier as keyof typeof tierLevels];
    const discountTierLevel = tierLevels[product.memberDiscount.tier];

    if (userTierLevel >= discountTierLevel) {
      return product.price * (1 - product.memberDiscount.percentage / 100);
    }

    return product.price;
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setShowCart(true);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (total, item) => total + calculateDiscountedPrice(item.product) * item.quantity,
    0
  );

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Store</h1>
        <button
          onClick={() => setShowCart(true)}
          className="relative p-2 hover:bg-gray-100 rounded-full"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="number"
                    min="0"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-24 px-3 py-2 border rounded-lg"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min="0"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-24 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              {/* Add more filters as needed */}
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Product Image */}
            <div className="aspect-square relative bg-gray-100">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.memberDiscount && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-sm font-medium">
                  {product.memberDiscount.percentage}% Off
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-lg font-bold mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>
              
              {/* Variants */}
              {product.variants?.map(variant => (
                <div key={variant.type} className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {variant.type}
                  </label>
                  <select
                    className="w-full border rounded-md py-1 px-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>Select {variant.type}</option>
                    {variant.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Price */}
              <div className="flex justify-between items-end mb-4">
                <div>
                  <span className="text-2xl font-bold">
                    ${calculateDiscountedPrice(product).toFixed(2)}
                  </span>
                  {product.memberDiscount && !user?.membershipTier && (
                    <p className="text-sm text-gray-600">
                      {product.memberDiscount.percentage}% off for {product.memberDiscount.tier} members
                    </p>
                  )}
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500"
                >
                  Add to Cart
                </button>
              </div>

              {/* Shipping Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-4 h-4" />
                <span>
                  {product.shipping.free ? 'Free Shipping' : product.shipping.estimate}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCart(false)}
          />
          
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Shopping Cart ({cart.length})</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                      <div className="w-20 h-20 relative rounded overflow-hidden">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          ${calculateDiscountedPrice(product).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="ml-auto text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  {user?.membershipTier && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Member Discount</span>
                      <span>Applied</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-yellow-400 text-black py-3 rounded-lg font-medium hover:bg-yellow-500"
                >
                  Proceed to Checkout
                </button>

                <p className="mt-4 text-sm text-gray-600 text-center">
                  Secure checkout powered by Stripe
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}