import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/database';
import User from '@/app/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Get user from NextAuth session
async function getUserFromSession(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }
    
    await connectToDatabase();
    return await User.findById(session.user.id);
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

// GET - Get user's API keys
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return API keys without the actual key values for security
    const apiKeys = user.apiKeys.map((key: any) => ({
      name: key.name,
      expiresAt: key.expiresAt,
      lastChars: key.key.slice(-4),
    }));

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve API keys' },
      { status: 500 }
    );
  }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, expiresIn } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // Generate API key
    const apiKey = `sk-${crypto.randomBytes(32).toString('hex')}`;
    
    // Calculate expiry date if provided
    let expiresAt;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);
    }

    // Add API key to user
    user.apiKeys.push({
      name,
      key: apiKey,
      expiresAt,
    });

    await user.save();

    // Return the full key only on creation
    return NextResponse.json({
      name,
      key: apiKey,
      expiresAt,
      message: 'Save this key securely. You won\'t be able to see it again.',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// DELETE - Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyName = searchParams.get('name');

    if (!keyName) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // Remove API key
    user.apiKeys = user.apiKeys.filter((key: any) => key.name !== keyName);
    await user.save();

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}