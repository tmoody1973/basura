import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API routes are working!',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'POST method working!',
    timestamp: new Date().toISOString()
  });
}