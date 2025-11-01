import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders } from '../../cors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/widget/conversations/[id] - Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    // Get conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        *,
        department:department_id(id, name),
        agent:agent_id(id, full_name, avatar_url),
        widget_customer:widget_customer_id(id, visitor_id, email, full_name)
      `)
      .eq('id', params.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404, headers: getCorsHeaders() }
      );
    }

    // Verify the conversation belongs to this session
    if (conversation.widget_customer_id) {
      // Widget customer conversation - check if session matches
      const { data: widgetCustomer } = await supabase
        .from('widget_customers')
        .select('*')
        .eq('id', conversation.widget_customer_id)
        .single();

      if (!widgetCustomer || widgetCustomer.visitor_id !== session.visitor_id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403, headers: getCorsHeaders() }
        );
      }
    }

    return NextResponse.json(
      { conversation },
      { headers: getCorsHeaders() }
    );
  } catch (error) {
    console.error('Error in GET /api/widget/conversations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// OPTIONS /api/widget/conversations/[id] - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

