import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() });
}

/**
 * POST /api/widget/conversations/[id]/typing
 * Update typing status for widget customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    const { isTyping } = await request.json();
    const conversationId = params.id;

    console.log('[Widget Typing API] Conversation:', conversationId, 'Is typing:', isTyping);

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from('widget_sessions')
      .select('*, widget_customer:visitor_id(id)')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    // Get widget customer
    const { data: widgetCustomer } = await supabase
      .from('widget_customers')
      .select('id')
      .eq('visitor_id', session.visitor_id)
      .eq('organization_id', session.organization_id)
      .single();

    if (!widgetCustomer) {
      return NextResponse.json(
        { error: 'Widget customer not found' },
        { status: 404, headers: getCorsHeaders() }
      );
    }

    // Verify conversation belongs to this widget customer
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('widget_customer_id', widgetCustomer.id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404, headers: getCorsHeaders() }
      );
    }

    // Upsert typing indicator
    const { error: typingError } = await supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: conversationId,
        user_id: null,
        widget_customer_id: widgetCustomer.id,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id,user_id,widget_customer_id'
      });

    if (typingError) {
      console.error('[Widget Typing API] Error updating typing indicator:', typingError);
      return NextResponse.json(
        { error: 'Failed to update typing status' },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
  } catch (error) {
    console.error('Error in POST /api/widget/conversations/[id]/typing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

