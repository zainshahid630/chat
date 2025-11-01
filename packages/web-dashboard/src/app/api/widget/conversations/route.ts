import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders } from '../cors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/widget/conversations - Create a new conversation from widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, departmentId, preChatData, customerData } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // Get widget session
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

    // Check if session already has a conversation
    if (session.conversation_id) {
      // Return existing conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select(`
          *,
          customer:customer_id(id, full_name, email, avatar_url),
          agent:agent_id(id, full_name, email, avatar_url),
          department:department_id(id, name)
        `)
        .eq('id', session.conversation_id)
        .single();

      if (existingConversation) {
        return NextResponse.json(
          { conversation: existingConversation },
          { headers: getCorsHeaders() }
        );
      }
    }

    // Create or get customer user
    let customerId: string;

    if (customerData?.email) {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerData.email)
        .eq('organization_id', session.organization_id)
        .eq('role', 'customer')
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('users')
          .insert({
            organization_id: session.organization_id,
            email: customerData.email,
            full_name: customerData.name || 'Anonymous Customer',
            role: 'customer',
            status: 'online',
          })
          .select()
          .single();

        if (customerError) {
          console.error('Error creating customer:', customerError);
          return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
        }

        customerId = newCustomer.id;
      }
    } else {
      // Create anonymous customer
      const { data: anonymousCustomer, error: customerError } = await supabase
        .from('users')
        .insert({
          organization_id: session.organization_id,
          email: `anonymous_${session.visitor_id || session.id}@widget.chatdesk.com`,
          full_name: 'Anonymous Customer',
          role: 'customer',
          status: 'online',
        })
        .select()
        .single();

      if (customerError) {
        console.error('Error creating anonymous customer:', customerError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }

      customerId = anonymousCustomer.id;
    }

    // Get widget settings to determine default department
    const { data: widgetSettings } = await supabase
      .from('widget_settings')
      .select('default_department_id')
      .eq('organization_id', session.organization_id)
      .single();

    const finalDepartmentId = departmentId || widgetSettings?.default_department_id;

    if (!finalDepartmentId) {
      return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    }

    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        organization_id: session.organization_id,
        department_id: finalDepartmentId,
        customer_id: customerId,
        status: 'waiting',
        pre_chat_data: preChatData || {},
      })
      .select(`
        *,
        customer:customer_id(id, full_name, email, avatar_url),
        agent:agent_id(id, full_name, email, avatar_url),
        department:department_id(id, name)
      `)
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    // Update widget session with conversation ID
    await supabase
      .from('widget_sessions')
      .update({ conversation_id: conversation.id })
      .eq('id', session.id);

    return NextResponse.json(
      { conversation },
      { headers: getCorsHeaders() }
    );
  } catch (error) {
    console.error('Error in POST /api/widget/conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// OPTIONS /api/widget/conversations - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

