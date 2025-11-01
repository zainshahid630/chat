import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS in API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET /api/departments - Get all departments for user's organization
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.organization_id) {
      return NextResponse.json({ error: 'User not associated with an organization' }, { status: 400 });
    }

    // Get departments for the user's organization
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error in GET /api/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/departments - Create a new department (org_admin and super_admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('authUser.id' )
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('authUser.id' )

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(authUser.id,'authUser.id' )

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    console.log('User query result:', { user, userError });

    if (userError || !user) {
      console.error('User fetch error:', userError);
      return NextResponse.json({
        error: 'User not found',
        details: userError?.message,
        userId: authUser.id
      }, { status: 404 });
    }

    // Check if user is org_admin or super_admin
    if (user.role !== 'org_admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Only org_admin and super_admin can create departments' }, { status: 403 });
    }

    if (!user.organization_id) {
      return NextResponse.json({ error: 'User not associated with an organization' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, is_active = true } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    // Create department
    const { data: department, error: createError } = await supabase
      .from('departments')
      .insert({
        organization_id: user.organization_id,
        name,
        description: description || null,
        is_active,
        pre_chat_form: [],
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating department:', createError);
      
      // Check for unique constraint violation
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'A department with this name already exists' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
    }

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

