import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/conversations - List conversations
export async function GET(request: NextRequest) {
  try {
    // Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('[Conversations API] Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Conversations API] No Bearer token in Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('[Conversations API] Token length:', token.length);

    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    console.log('[Conversations API] Auth user:', authUser?.id, 'Error:', authError?.message);

    if (authError || !authUser) {
      console.error('[Conversations API] Invalid token:', authError?.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      console.error('[Conversations API] User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[Conversations API] User role:', user.role);

    // Only super_admin, org_admin and agent can access conversations
    if (!['super_admin', 'org_admin', 'agent'].includes(user.role)) {
      console.error('[Conversations API] Forbidden - user role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const departmentId = searchParams.get('department_id');
    const agentId = searchParams.get('agent_id');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('conversations')
      .select(`
        *,
        widget_customer:widget_customer_id(id, visitor_id, email, full_name, phone, custom_fields),
        customer:customer_id(id, full_name, email, avatar_url),
        agent:agent_id(id, full_name, email, avatar_url),
        department:department_id(id, name),
        messages(id, content, created_at, sender_id)
      `)
      .eq('organization_id', user.organization_id)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    // Execute query
    const { data: conversations, error: conversationsError } = await query;

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Filter by search if provided (search in customer name/email or widget customer)
    let filteredConversations = conversations || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversations = filteredConversations.filter((conv: any) => {
        const customerName = conv.customer?.full_name?.toLowerCase() || '';
        const customerEmail = conv.customer?.email?.toLowerCase() || '';
        const widgetCustomerName = conv.widget_customer?.full_name?.toLowerCase() || '';
        const widgetCustomerEmail = conv.widget_customer?.email?.toLowerCase() || '';
        return customerName.includes(searchLower) ||
               customerEmail.includes(searchLower) ||
               widgetCustomerName.includes(searchLower) ||
               widgetCustomerEmail.includes(searchLower);
      });
    }

    // Add unread count and last message to each conversation
    const conversationsWithMeta = filteredConversations.map((conv: any) => {
      const messages = conv.messages || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      
      return {
        ...conv,
        last_message: lastMessage,
        unread_count: 0, // TODO: Implement unread count based on message_status table
      };
    });

    return NextResponse.json(conversationsWithMeta);
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    // Get Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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

    // Parse request body
    const body = await request.json();
    const { department_id, customer_id, pre_chat_data } = body;

    if (!department_id || !customer_id) {
      return NextResponse.json(
        { error: 'department_id and customer_id are required' },
        { status: 400 }
      );
    }

    // Create conversation
    const { data: conversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        organization_id: user.organization_id,
        department_id,
        customer_id,
        status: 'waiting',
        pre_chat_data: pre_chat_data || {},
      })
      .select(`
        *,
        customer:customer_id(id, full_name, email, avatar_url),
        department:department_id(id, name)
      `)
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

