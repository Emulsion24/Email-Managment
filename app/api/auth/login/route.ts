import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Fetch user from database
    const result = await query(
      'SELECT id, email, password, role, name FROM public.users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    // Security Note: Use generic messages to prevent email enumeration
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Compare the plain text password with the bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- NEW: ADMIN CHECK ---
    // This prevents regular users or installers from getting an auth_token
    if (user.role !== 'admin') {
      console.warn(`Unauthorized login attempt by ${email} with role ${user.role}`);
      return NextResponse.json(
        { error: 'Access denied. Administrator privileges required.' }, 
        { status: 403 } // Forbidden
      );
    }

    // 3. Create JWT (Payload now strictly contains verified admin data)
    const token = await new SignJWT({ 
      id: user.id, 
      role: user.role, 
      name: user.name 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // 4. Set Secure Cookie
    const cookieStore = await cookies(); 
    
    cookieStore.set('auth_token', token, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // Only sends over HTTPS in prod
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax', // CSRF protection
    });

    return NextResponse.json({ 
      success: true, 
      role: user.role,
      message: "Admin authenticated successfully" 
    });

  } catch (err: any) {
    console.error("Auth Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}