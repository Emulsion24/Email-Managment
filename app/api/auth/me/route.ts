import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Use the same secret key from your .env
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET() {
  try {
    // 1. Await the cookie store (Required in Next.js 15+)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    // 2. If no token exists, the user is not logged in
    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: 'No session found' },
        { status: 401 }
      );
    }

    // 3. Verify the JWT
    const { payload } = await jwtVerify(token, secret);

    // 4. Return the decoded user data (id, role, name)
    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.id,
        name: payload.name,
        role: payload.role,
        email: payload.email,
      },
    });
  } catch (error) {
    // If JWT is expired or tampered with
    console.error('JWT Verification failed:', error);
    
    return NextResponse.json(
      { authenticated: false, message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}