import { NextResponse } from 'next/server';
import { initializeReviewersInFirestore } from '@/app/utils/initializeReviewers';

export async function GET() {
  try {
    await initializeReviewersInFirestore();
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initialize database', error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 