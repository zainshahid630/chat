import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/conversations/[id]/typing
 * Update typing status for a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { isTyping } = await request.json();
    const conversationId = params.id;

    console.log('[Typing API] User:', user.id, 'Conversation:', conversationId, 'Is typing:', isTyping);

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is in the same organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userProfile?.organization_id !== conversation.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Upsert typing indicator
    const { error: typingError } = await supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        widget_customer_id: null,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id,user_id,widget_customer_id'
      });

    if (typingError) {
      console.error('[Typing API] Error updating typing indicator:', typingError);
      return NextResponse.json(
        { error: 'Failed to update typing status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/conversations/[id]/typing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversations/[id]/typing
 * Get typing status for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversationId = params.id;

    // Get typing indicators for this conversation (excluding current user)
    const { data: typingIndicators, error } = await supabase
      .from('typing_indicators')
      .select(`
        *,
        user:user_id(id, full_name, avatar_url),
        widget_customer:widget_customer_id(id, full_name)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_typing', true)
      .neq('user_id', user.id)
      .gte('updated_at', new Date(Date.now() - 5000).toISOString()); // Only recent (last 5 seconds)

    if (error) {
      console.error('[Typing API] Error fetching typing indicators:', error);
      return NextResponse.json(
        { error: 'Failed to fetch typing status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ typingIndicators });
  } catch (error) {
    console.error('Error in GET /api/conversations/[id]/typing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

