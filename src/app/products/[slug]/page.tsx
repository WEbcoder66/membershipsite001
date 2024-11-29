import Link from 'next/link';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const isMonthly = params.slug === 'monthly-supporter';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-yellow-600 hover:text-yellow-700">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <img 
            src="/api/placeholder/800/400"
            alt="Product cover"
            className="w-full h-96 object-cover"
          />
          <div className="p-8">
            <h1 className="text-3xl font-bold text-black">
              {isMonthly 
                ? 'Monthly Supporter – All Access' 
                : 'The Making Of "Our Trip Around The World" Documentary'}
            </h1>
            
            <p className="mt-4 text-2xl font-semibold text-black">
              {isMonthly ? '$19.99/year' : '$5.99'}
            </p>
            
            <div className="mt-8 prose max-w-none text-black">
              <p>
                {isMonthly 
                  ? 'Get unlimited access to all our content, behind-the-scenes footage, and exclusive community features.'
                  : 'Go behind the scenes of our biggest documentary yet. See how we planned, filmed, and produced this amazing journey.'}
              </p>
              
              <button className="mt-8 bg-yellow-400 px-8 py-3 rounded-md font-semibold text-black hover:bg-yellow-500 w-full">
                {isMonthly ? 'Sign Up Now' : 'Add To Cart'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}