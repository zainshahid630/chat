import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders } from '../cors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/widget/init - Initialize widget session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { widgetKey, visitorId, userData, existingSessionToken } = body;

    console.log('[Widget Init] Request received for widget key:', widgetKey);
    console.log('[Widget Init] Visitor ID:', visitorId);
    console.log('[Widget Init] Existing session token:', existingSessionToken ? existingSessionToken.substring(0, 20) + '...' : 'None');

    if (!widgetKey) {
      return NextResponse.json(
        { error: 'Widget key is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // Get widget settings
    const { data: settings, error: settingsError } = await supabase
      .from('widget_settings')
      .select('*, organization:organization_id(id, name)')
      .eq('widget_key', widgetKey)
      .eq('enabled', true)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Invalid widget key' },
        { status: 404, headers: getCorsHeaders() }
      );
    }

    // Check allowed domains (if configured) - skip for local file:// testing
    const origin = request.headers.get('origin');
    if (settings.allowed_domains && settings.allowed_domains.length > 0 && origin !== 'null') {
      const isAllowed = settings.allowed_domains.some(domain => {
        if (origin) {
          return origin.includes(domain);
        }
        return false;
      });

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Domain not allowed' },
          { status: 403, headers: getCorsHeaders() }
        );
      }
    }

    // Get visitor information from headers
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Parse user agent for device info (basic parsing)
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    const deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');

    let session;
    let conversationId = null;

    // Check if there's an existing session token
    if (existingSessionToken) {
      console.log('[Widget Init] Existing session token: Yes');
      console.log('[Widget Init] Checking existing session token...');

      const { data: existingSession, error: existingError } = await supabase
        .from('widget_sessions')
        .select('*, conversation:conversation_id(id, status, department_id, widget_customer_id)')
        .eq('session_token', existingSessionToken)
        .eq('widget_key', widgetKey)
        .eq('is_active', true)
        .single();

      if (existingError) {
        console.log('[Widget Init] Error finding existing session:', existingError.message);
        console.log('[Widget Init] Will create new session');
      } else if (!existingSession) {
        console.log('[Widget Init] No session found with this token');
        console.log('[Widget Init] Will create new session');
      } else if (new Date(existingSession.expires_at) <= new Date()) {
        console.log('[Widget Init] Session expired at:', existingSession.expires_at);
        console.log('[Widget Init] Will create new session');
      } else {
        console.log('[Widget Init] Valid existing session found!');
        console.log('[Widget Init] Session visitor_id:', existingSession.visitor_id);
        console.log('[Widget Init] Session conversation_id:', existingSession.conversation_id);

        // Update existing session
        const { data: updatedSession, error: updateError } = await supabase
          .from('widget_sessions')
          .update({
            last_seen_at: new Date().toISOString(),
            current_url: userData?.currentUrl || existingSession.current_url,
            ip_address: ipAddress,
          })
          .eq('id', existingSession.id)
          .select('*, conversation:conversation_id(id, status, department_id, widget_customer_id)')
          .single();

        if (!updateError && updatedSession) {
          session = updatedSession;
          conversationId = updatedSession.conversation_id;
          console.log('[Widget Init] Session updated, conversation_id:', conversationId);
        } else {
          console.log('[Widget Init] Error updating session:', updateError?.message);
        }
      }
    } else {
      console.log('[Widget Init] Existing session token: No');
    }

    // If no valid existing session, try to find by visitor_id
    if (!session && visitorId) {
      console.log('[Widget Init] No session from token, checking by visitor_id...');

      const { data: visitorSession, error: visitorError } = await supabase
        .from('widget_sessions')
        .select('*, conversation:conversation_id(id, status, department_id, widget_customer_id)')
        .eq('visitor_id', visitorId)
        .eq('widget_key', widgetKey)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!visitorError && visitorSession && new Date(visitorSession.expires_at) > new Date()) {
        console.log('[Widget Init] Found existing session by visitor_id!');
        console.log('[Widget Init] Session conversation_id:', visitorSession.conversation_id);

        // Update this session
        const { data: updatedSession, error: updateError } = await supabase
          .from('widget_sessions')
          .update({
            last_seen_at: new Date().toISOString(),
            current_url: userData?.currentUrl || visitorSession.current_url,
            ip_address: ipAddress,
          })
          .eq('id', visitorSession.id)
          .select('*, conversation:conversation_id(id, status, department_id, widget_customer_id)')
          .single();

        if (!updateError && updatedSession) {
          session = updatedSession;
          conversationId = updatedSession.conversation_id;
          console.log('[Widget Init] Session updated from visitor_id, conversation_id:', conversationId);
        }
      } else {
        console.log('[Widget Init] No valid session found by visitor_id');
      }
    }

    // If still no valid session, create a new one
    if (!session) {
      console.log('[Widget Init] Creating new session...');

      const { data: newSession, error: sessionError } = await supabase
        .from('widget_sessions')
        .insert({
          organization_id: settings.organization_id,
          widget_key: widgetKey,
          visitor_id: visitorId,
          ip_address: ipAddress,
          user_agent: userAgent,
          referrer: request.headers.get('referer') || null,
          current_url: userData?.currentUrl || null,
          device_type: deviceType,
          is_active: true,
        })
        .select()
        .single();

      if (sessionError) {
        console.error('[Widget Init] Error creating widget session:', sessionError);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500, headers: getCorsHeaders() });
      }

      session = newSession;
      console.log('[Widget Init] New session created:', session.session_token);
    }

    // Return widget configuration
    return NextResponse.json({
      sessionToken: session.session_token,
      organizationId: settings.organization_id,
      organizationName: settings.organization?.name,
      conversationId: conversationId, // Return existing conversation if any
      config: {
        primaryColor: settings.primary_color,
        position: settings.position,
        widgetTitle: settings.widget_title,
        greetingMessage: settings.greeting_message,
        autoOpen: settings.auto_open,
        autoOpenDelay: settings.auto_open_delay,
        showAgentAvatars: settings.show_agent_avatars,
        showTypingIndicator: settings.show_typing_indicator,
        playNotificationSound: settings.play_notification_sound,
        defaultDepartmentId: settings.default_department_id,
      },
    }, {
      headers: getCorsHeaders(),
    });
  } catch (error) {
    console.error('Error in POST /api/widget/init:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// OPTIONS /api/widget/init - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

