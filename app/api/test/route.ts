import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
  \
    const result = await query('SELECT NOW() as current_time, current_database() as db_name');
    
    return NextResponse.json({
      status: "Connected successfully! ✅",
      time: result.rows[0].current_time,
      database: result.rows[0].db_name
    });
  } catch (error: any) {
    console.error("Connection Error:", error);
    return NextResponse.json({
      status: "Connection failed! ❌",
      error: error.message,
      hint: "Check if your IP is allowed in Supabase settings or if the connection string is correct."
    }, { status: 500 });
  }
}