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

// PUT /api/agents/[id]/departments - Update agent's department assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { department_ids } = await request.json();

    if (!Array.isArray(department_ids)) {
      return NextResponse.json({ error: 'department_ids must be an array' }, { status: 400 });
    }

    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('agent_departments')
      .delete()
      .eq('agent_id', params.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Create new assignments
    if (department_ids.length > 0) {
      const assignments = department_ids.map((dept_id: string) => ({
        agent_id: params.id,
        department_id: dept_id,
      }));

      const { error: insertError } = await supabase
        .from('agent_departments')
        .insert(assignments);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Get updated agent with departments
    const { data: agent, error: agentError } = await supabase
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
      .eq('id', params.id)
      .single();

    if (agentError) {
      return NextResponse.json({ error: agentError.message }, { status: 500 });
    }

    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error('Error updating agent departments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

