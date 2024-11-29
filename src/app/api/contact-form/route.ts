// src/app/api/contact/route.ts
import { NextResponse } from 'next/server';

// Use Node.js runtime instead of Edge for better email support
export const runtime = 'nodejs';

// Configure runtime options
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Validation helper
function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Type definition for form data
interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  budget?: string;
  timeline?: string;
}

export async function POST(request: Request) {
  try {
    // Parse incoming request
    const body: ContactForm = await request.json();
    const { name, email, subject, message, budget, timeline } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Rate limiting check (implement proper rate limiting in production)
    // This is a basic example - use a proper rate limiting service in production
    const userIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `contact_form_${userIP}`;

    // In production, you would use a service like Redis or Upstash for rate limiting
    // For now, we'll just log the attempt
    console.log(`Contact form submission from IP: ${userIP}`);

    // Prepare notification data
    const notificationData = {
      timestamp: new Date().toISOString(),
      name,
      email,
      subject,
      message,
      ...(budget && { budget }),
      ...(timeline && { timeline }),
      ip: userIP,
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // In production, implement your preferred notification method:
    // 1. Email using a service like SendGrid or AWS SES
    // 2. Slack notification
    // 3. Save to database
    // 4. Message queue
    
    // For demo purposes, we'll just log it
    console.log('New contact form submission:', notificationData);

    // Example email sending setup (uncomment and configure when ready)
    /*
    const emailService = new EmailService({
      apiKey: process.env.EMAIL_SERVICE_API_KEY
    });

    await emailService.send({
      to: process.env.NOTIFICATION_EMAIL,
      subject: `New Contact Form: ${subject}`,
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
        Budget: ${budget || 'Not specified'}
        Timeline: ${timeline || 'Not specified'}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
        ${timeline ? `<p><strong>Timeline:</strong> ${timeline}</p>` : ''}
      `
    });
    */

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully'
    });

  } catch (error) {
    // Log the error (use proper error logging in production)
    console.error('Contact form error:', error);

    // Return error response
    return NextResponse.json(
      { 
        error: 'Failed to process contact form submission',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: Request) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}