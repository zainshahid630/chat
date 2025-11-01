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

    // Get widget settings to check enabled departments
    const { data: widgetSettings } = await supabase
      .from('widget_settings')
      .select('enabled_department_ids')
      .eq('organization_id', session.organization_id)
      .single();

    console.log('[Widget Departments] Organization ID:', session.organization_id);
    console.log('[Widget Departments] Widget settings:', widgetSettings);

    // Get active departments
    let query = supabase
      .from('departments')
      .select('id, name, description, pre_chat_form')
      .eq('organization_id', session.organization_id)
      .eq('is_active', true);

    // Filter by enabled departments if configured
    if (widgetSettings?.enabled_department_ids && widgetSettings.enabled_department_ids.length > 0) {
      console.log('[Widget Departments] Filtering by enabled IDs:', widgetSettings.enabled_department_ids);
      query = query.in('id', widgetSettings.enabled_department_ids);
    } else {
      console.log('[Widget Departments] Showing all active departments');
    }

    const { data: departments, error: departmentsError } = await query.order('name');

    console.log('[Widget Departments] Found departments:', departments?.length || 0);

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

