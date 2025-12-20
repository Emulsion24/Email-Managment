// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);



export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboard) {
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    try {
      await jwtVerify(token, secret); // Verify token exists and is valid
      
      const response = NextResponse.next();
      
      // IMPORTANT: Prevent the browser from caching the dashboard
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    } catch (err) {
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}
// 4. Optimization: Only run middleware on these paths
export const config = {
  matcher: ['/dashboard/:path*'],
};