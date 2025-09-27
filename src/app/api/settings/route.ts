import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/connection';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM user_settings ORDER BY created_at DESC LIMIT 1');
    const settings = stmt.get() as any;
    
    if (!settings) {
      return NextResponse.json({ settings: null }, { status: 200 });
    }

    // Don't expose the full API key in responses, just indicate if it exists
    const safeSettings = {
      ...settings,
      api_key: settings.api_key ? '***' : null,
      has_api_key: !!settings.api_key
    };

    return NextResponse.json({ settings: safeSettings }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key, user_name, email, phone } = body;

    if (!api_key) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const db = getDatabase();
    
    // Check if settings already exist
    const existingStmt = db.prepare('SELECT id FROM user_settings LIMIT 1');
    const existing = existingStmt.get() as any;

    const now = new Date().toISOString();

    if (existing) {
      // Update existing settings
      const updateStmt = db.prepare(`
        UPDATE user_settings 
        SET api_key = ?, user_name = ?, email = ?, phone = ?, setup_completed = 1, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(api_key, user_name, email, phone, now, existing.id);
    } else {
      // Create new settings
      const insertStmt = db.prepare(`
        INSERT INTO user_settings (api_key, user_name, email, phone, setup_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `);
      insertStmt.run(api_key, user_name, email, phone, now, now);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key, user_name, email, phone } = body;

    const db = getDatabase();
    const now = new Date().toISOString();

    const updateStmt = db.prepare(`
      UPDATE user_settings 
      SET api_key = COALESCE(?, api_key),
          user_name = COALESCE(?, user_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          updated_at = ?
      WHERE id = 1
    `);
    
    const result = updateStmt.run(api_key, user_name, email, phone, now);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'No settings found to update' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}