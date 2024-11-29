// src/components/ProductCard.tsx
import React from 'react';
import { Tag, Truck } from 'lucide-react';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Product Image */}
      <div className="relative aspect-square">
        <img
          src={product.images[0] || '/api/placeholder/400/400'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {product.memberDiscount && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-sm font-medium">
            {product.memberDiscount.percentage}% Off
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-black mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{product.description}</p>

        {/* Variants */}
        {product.variants?.map((variant) => (
          <div key={variant.type} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {variant.type}
            </label>
            <select className="w-full border rounded-md py-1 px-2 text-sm">
              <option value="">Select {variant.type}</option>
              {variant.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        ))}

        {/* Price and Add to Cart */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-black">
              ${product.price.toFixed(2)}
            </span>
            {product.memberDiscount && (
              <p className="text-sm text-gray-600">
                {product.memberDiscount.percentage}% off for members
              </p>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product.id)}
            className="bg-yellow-400 px-4 py-2 rounded-lg font-medium text-black hover:bg-yellow-500"
          >
            Add to Cart
          </button>
        </div>

        {/* Shipping Info */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          {product.shipping.free ? (
            <Tag className="w-4 h-4 text-green-600" />
          ) : (
            <Tag className="w-4 h-4" />
          )}
          <span>
            {product.shipping.free ? 'Free Shipping' : product.shipping.estimate}
          </span>
        </div>

        {/* Stock Status */}
        {!product.inStock && (
          <p className="mt-2 text-sm text-red-600">Out of Stock</p>
        )}
      </div>
    </div>
  );
}