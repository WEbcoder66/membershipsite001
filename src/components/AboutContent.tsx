// src/components/AboutContent.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function AboutContent() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold mb-4">About Us</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Welcome to <span className="font-semibold">Super Dope Membership Site</span>, where creators take control 
              of their content, audience, and revenue. We specialize in building custom membership websites 
              tailored to your unique vision—no templates, no middlemen, and no unnecessary cuts to 
              third-party platforms.
            </p>
          </div>

          {/* Mission */}
          <div>
            <p className="text-gray-700 leading-relaxed">
              Whether you're looking to launch a subscription service, showcase exclusive content, 
              or build a thriving community, we make it happen with fully coded, personalized solutions.
            </p>
          </div>

          {/* Why Choose Us */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
            <ul className="space-y-4 text-gray-700">
              <li>
                <span className="font-semibold">Complete Ownership:</span> Your website, your rules. 
                Keep 100% of your earnings and enjoy full control over your content.
              </li>
              <li>
                <span className="font-semibold">Custom-Built for You:</span> Every feature, design element, 
                and functionality is crafted from scratch to match your needs.
              </li>
              <li>
                <span className="font-semibold">Flexible Payment Integration:</span> Use the payment 
                processor you prefer, including Stripe, Square, or others—seamlessly integrated into your site.
              </li>
              <li>
                <span className="font-semibold">Scalable & Secure:</span> Your site is built to grow with you, 
                with modern coding practices and top-notch security.
              </li>
              <li>
                <span className="font-semibold">Freedom from Gatekeepers:</span> No need to rely on platforms 
                like Patreon or SubscribeStar. We help you create an independent space where you can thrive.
              </li>
            </ul>
          </div>

          {/* Demo Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Explore the Demo</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              This demo showcases the kind of membership sites we can create for you. From paywalled 
              content to tiered subscriptions, we've built a platform that looks and works just like 
              popular creator platforms—but is entirely yours.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Browse through our demo features to see how you can:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700">
              <li>Manage multiple membership tiers</li>
              <li>Gate content based on subscription levels</li>
              <li>Process payments and handle subscriptions</li>
              <li>Engage with your community</li>
              <li>Track analytics and growth</li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="pt-8 border-t text-center">
            <p className="text-lg text-gray-900 font-medium mb-6">
              Ready to take the next step? Let's build your vision, together.
            </p>
            <button
              onClick={() => router.push('/contact')}
              className="inline-flex px-8 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              Contact Us
            </button>
          </div>

          {/* Footer Note */}
          <div className="text-center text-sm text-gray-600 mt-8">
            <p>Each project is unique, and we're here to help bring your vision to life.</p>
            <p>Get in touch to discuss your specific needs and requirements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}