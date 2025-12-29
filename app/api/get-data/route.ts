import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: Request) {
  try {
    // --- 1. ADMIN AUTHORIZATION CHECK ---
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // --- 2. QUERY PARAMETERS ---
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || ''; 
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const roleFilter = searchParams.get('roleFilter') || 'all';
    
    const limit = 6;
    const offset = (page - 1) * limit;

    let dataQuery = '';
    let countQuery = '';
    let params: (string | number)[] = [];

    // --- 3. FETCHING LOGIC ---
    if (type === 'history') {
      // Logic for Email History
      let whereClause = `WHERE (recipient_name ILIKE $1 OR recipient_email ILIKE $1)`;
      params = [`%${search}%`];

      if (roleFilter !== 'all') {
        // FIX: Handle 'bulk' specifically by checking the boolean column
        if (roleFilter === 'bulk') {
          whereClause += ` AND is_bulk = true`;
        } else {
          // Filter by specific role (user/installer)
          params.push(roleFilter);
          whereClause += ` AND role = $2`;
        }
      }

      dataQuery = `SELECT * FROM email_history ${whereClause} ORDER BY sent_at DESC LIMIT ${limit} OFFSET ${offset}`;
      countQuery = `SELECT COUNT(*) FROM email_history ${whereClause}`;
    } else {
      // Logic for Users/Installers
      params = [type, `%${search}%`];
      const whereClause = `WHERE role = $1 AND is_banned = false AND (name ILIKE $2 OR email ILIKE $2)`;
      
      dataQuery = `SELECT id, name, email, role, picture FROM public.users ${whereClause} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
      countQuery = `SELECT COUNT(*) FROM public.users ${whereClause}`;
    }

    const [dataResult, countResult] = await Promise.all([
      query(dataQuery, params),
      query(countQuery, params)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      items: dataResult.rows,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Fetch API Error:", errorMessage);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}