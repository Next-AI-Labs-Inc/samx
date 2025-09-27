import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/connection';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_name, phone, email, feedback_text, page_url, page_title } = body;

    if (!user_name || !phone || !feedback_text || !page_url) {
      return NextResponse.json({ 
        error: 'Name, phone, feedback, and page URL are required' 
      }, { status: 400 });
    }

    const db = getDatabase();
    const feedbackId = uuidv4();
    const now = new Date().toISOString();

    // Save feedback to database
    const insertStmt = db.prepare(`
      INSERT INTO feedback (id, user_name, phone, email, feedback_text, page_url, page_title, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(feedbackId, user_name, phone, email, feedback_text, page_url, page_title, now);

    // Send email
    try {
      await sendFeedbackEmail({
        user_name,
        phone,
        email,
        feedback_text,
        page_url,
        page_title,
        feedbackId
      });

      // Update status to sent
      const updateStmt = db.prepare(`
        UPDATE feedback SET status = 'sent', sent_at = ? WHERE id = ?
      `);
      updateStmt.run(now, feedbackId);

      return NextResponse.json({ 
        success: true, 
        message: 'Feedback submitted and sent successfully' 
      }, { status: 200 });

    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      
      // Update status to failed
      const updateStmt = db.prepare(`
        UPDATE feedback SET status = 'failed' WHERE id = ?
      `);
      updateStmt.run(feedbackId);

      return NextResponse.json({ 
        success: true, 
        message: 'Feedback saved but email failed to send. We will follow up manually.' 
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

async function sendFeedbackEmail(params: {
  user_name: string;
  phone: string;
  email?: string;
  feedback_text: string;
  page_url: string;
  page_title?: string;
  feedbackId: string;
}) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM;
  
  console.log('Email config check:', {
    hasUser: !!smtpUser,
    hasPassword: !!smtpPassword,
    hasFrom: !!smtpFrom,
    user: smtpUser?.substring(0, 5) + '***'
  });
  
  if (!smtpUser || !smtpPassword) {
    console.error('Missing SMTP configuration. Please set SMTP_USER and SMTP_PASSWORD in .env.local');
    throw new Error('SMTP not configured');
  }
  
  // Configure email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPassword
    },
    debug: true, // Enable debug output
    logger: true // Log to console
  });

  const emailBody = `
New Feedback from SamX Application

Feedback ID: ${params.feedbackId}
Date: ${new Date().toLocaleString()}

User Information:
- Name: ${params.user_name}
- Phone: ${params.phone}
- Email: ${params.email || 'Not provided'}

Page Information:
- Page URL: ${params.page_url}
- Page Title: ${params.page_title || 'Not provided'}

Feedback:
${params.feedback_text}

---
This feedback was automatically submitted through the SamX application.
  `.trim();

  const mailOptions = {
    from: smtpFrom || smtpUser,
    to: 'founder@ixcoach.com',
    subject: `SamX Feedback from ${params.user_name}`,
    text: emailBody,
    replyTo: params.email || undefined
  };

  console.log('Sending email with options:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });

  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log('SMTP connection verified');
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, user_name, phone, email, page_url, page_title, status, created_at, sent_at
      FROM feedback 
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    const feedback = stmt.all();

    return NextResponse.json({ feedback }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}