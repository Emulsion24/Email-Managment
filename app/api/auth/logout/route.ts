import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Delete the cookie on the server
  cookieStore.delete('auth_token');

  return NextResponse.json({ success: true });
}