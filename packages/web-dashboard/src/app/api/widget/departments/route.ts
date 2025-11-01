import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders } from '../cors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/widget/departments - Get departments for widget
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from('widget_sessions')
      .select('organization_id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    // Get active departments
    const { data: departments, error: departmentsError } = await supabase
      .from('departments')
      .select('id, name, description, pre_chat_form')
      .eq('organization_id', session.organization_id)
      .eq('is_active', true)
      .order('name');

    if (departmentsError) {
      console.error('Error fetching departments:', departmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch departments' },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      { departments },
      { headers: getCorsHeaders() }
    );
  } catch (error) {
    console.error('Error in GET /api/widget/departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// OPTIONS /api/widget/departments - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

