import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders } from '../../../cors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/widget/conversations/[id]/messages - Get messages for a conversation
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

    // Verify conversation belongs to session
    if (session.conversation_id !== params.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403, headers: getCorsHeaders() }
      );
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, full_name, email, avatar_url, role),
        widget_sender:widget_sender_id(id, visitor_id, email, full_name)
      `)
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      { messages },
      { headers: getCorsHeaders() }
    );
  } catch (error) {
    console.error('Error in GET /api/widget/conversations/[id]/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// POST /api/widget/conversations/[id]/messages - Send a message
export async function POST(
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

    // Verify conversation belongs to session
    if (session.conversation_id !== params.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403, headers: getCorsHeaders() }
      );
    }

    // Get conversation to find customer ID or widget customer ID
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('customer_id, widget_customer_id, organization_id')
      .eq('id', params.id)
      .single();

    if (conversationError || !conversation) {
      console.error('[Widget Messages] Conversation not found:', conversationError);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404, headers: getCorsHeaders() }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content, messageType = 'text', mediaUrl, mediaType, mediaSize, mediaName } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { error: 'Content or media is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    console.log('[Widget Messages] Creating message for conversation:', params.id);
    console.log('[Widget Messages] Sender - customer_id:', conversation.customer_id, 'widget_customer_id:', conversation.widget_customer_id);

    // Create message with appropriate sender
    const messageData: any = {
      conversation_id: params.id,
      content: content || '',
      message_type: messageType,
      media_url: mediaUrl,
      media_type: mediaType,
      media_size: mediaSize,
      media_name: mediaName,
    };

    // Set sender based on conversation type
    if (conversation.widget_customer_id) {
      messageData.widget_sender_id = conversation.widget_customer_id;
      messageData.sender_id = null;
    } else if (conversation.customer_id) {
      messageData.sender_id = conversation.customer_id;
      messageData.widget_sender_id = null;
    } else {
      console.error('[Widget Messages] No customer_id or widget_customer_id found');
      return NextResponse.json(
        { error: 'Invalid conversation - no customer found' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        sender:sender_id(id, full_name, email, avatar_url, role),
        widget_sender:widget_sender_id(id, visitor_id, email, full_name)
      `)
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.id);

    return NextResponse.json(
      { message },
      { headers: getCorsHeaders() }
    );
  } catch (error) {
    console.error('Error in POST /api/widget/conversations/[id]/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// OPTIONS /api/widget/conversations/[id]/messages - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

