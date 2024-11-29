// src/lib/demoData.ts
export const demoProducts = [
  {
    id: '1',
    name: 'Limited Edition T-Shirt',
    description: 'Premium quality cotton t-shirt with exclusive design',
    price: 29.99,
    image: '/api/placeholder/400/400?text=T-Shirt',
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
    memberDiscount: {
      tier: 'premium',
      percentage: 20
    }
  },
  {
    id: '2',
    name: 'Digital Workshop Bundle',
    description: 'Complete set of workshop materials and resources',
    price: 49.99,
    image: '/api/placeholder/400/400?text=Workshop',
    category: 'Digital',
    memberDiscount: {
      tier: 'basic',
      percentage: 10
    }
  },
  {
    id: '3',
    name: 'Exclusive Poster Set',
    description: 'Collection of high-quality art prints',
    price: 39.99,
    image: '/api/placeholder/400/400?text=Posters',
    category: 'Merchandise',
    memberDiscount: {
      tier: 'premium',
      percentage: 15
    }
  }
];