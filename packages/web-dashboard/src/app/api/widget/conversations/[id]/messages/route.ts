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
        sender:sender_id(id, full_name, email, avatar_url, role)
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

    // Get conversation to find customer ID
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('customer_id, organization_id')
      .eq('id', params.id)
      .single();

    if (conversationError || !conversation) {
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

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.id,
        sender_id: conversation.customer_id,
        content: content || '',
        message_type: messageType,
        media_url: mediaUrl,
        media_type: mediaType,
        media_size: mediaSize,
        media_name: mediaName,
      })
      .select(`
        *,
        sender:sender_id(id, full_name, email, avatar_url, role)
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

