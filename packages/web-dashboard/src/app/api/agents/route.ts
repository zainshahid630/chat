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

// GET /api/agents - Get all agents for user's organization
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

    // Get agents for the user's organization (agents and org_admins)
    const { data: agents, error: agentsError } = await supabase
      .from('users')
      .select(`
        *,
        agent_departments (
          id,
          department_id,
          departments (
            id,
            name
          )
        )
      `)
      .eq('organization_id', user.organization_id)
      .in('role', ['agent', 'org_admin'])
      .order('created_at', { ascending: false });

    if (agentsError) {
      return NextResponse.json({ error: agentsError.message }, { status: 500 });
    }

    return NextResponse.json({ agents: agents || [] });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agents - Invite a new agent (org_admin and super_admin only)
export async function POST(request: NextRequest) {
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

    // Check if user is org_admin or super_admin
    if (user.role !== 'org_admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, full_name, role = 'agent', department_ids = [] } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate role
    if (role !== 'agent' && role !== 'org_admin') {
      return NextResponse.json({ error: 'Invalid role. Must be agent or org_admin' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create user in auth (this will auto-create user profile via trigger)
    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || '',
        role,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Update user profile with organization_id and is_active
    // (The trigger already created the basic profile)
    const { data: agent, error: profileError } = await supabase
      .from('users')
      .update({
        organization_id: user.organization_id,
        is_active: true,
        full_name: full_name || null,
      })
      .eq('id', newAuthUser.user.id)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Assign to departments if provided
    if (department_ids.length > 0) {
      const assignments = department_ids.map((dept_id: string) => ({
        agent_id: agent.id,
        department_id: dept_id,
      }));

      const { error: assignError } = await supabase
        .from('agent_departments')
        .insert(assignments);

      if (assignError) {
        console.error('Error assigning departments:', assignError);
      }
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

