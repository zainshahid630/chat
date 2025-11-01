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

// GET /api/departments/[id] - Get department by ID
export async function GET(
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

    // Get department
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (deptError || !department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ department });
  } catch (error) {
    console.error('Error in GET /api/departments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/departments/[id] - Update department (org_admin and super_admin only)
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
      return NextResponse.json({ error: 'Forbidden: Only org_admin and super_admin can update departments' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, is_active, pre_chat_form } = body;

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (pre_chat_form !== undefined) updateData.pre_chat_form = pre_chat_form;

    // Update department
    const { data: department, error: updateError } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating department:', updateError);
      
      // Check for unique constraint violation
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'A department with this name already exists' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
    }

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ department });
  } catch (error) {
    console.error('Error in PUT /api/departments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/departments/[id] - Delete department (org_admin and super_admin only)
export async function DELETE(
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
      return NextResponse.json({ error: 'Forbidden: Only org_admin and super_admin can delete departments' }, { status: 403 });
    }

    // Check if department has active conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('department_id', params.id)
      .eq('status', 'active')
      .limit(1);

    if (convError) {
      console.error('Error checking conversations:', convError);
      return NextResponse.json({ error: 'Failed to check department usage' }, { status: 500 });
    }

    if (conversations && conversations.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete department with active conversations. Please close all conversations first.' 
      }, { status: 409 });
    }

    // Delete department
    const { error: deleteError } = await supabase
      .from('departments')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting department:', deleteError);
      return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/departments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

