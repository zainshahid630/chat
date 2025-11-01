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
    const { widgetKey, visitorId, userData } = body;

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

    // Create or update widget session
    const { data: session, error: sessionError } = await supabase
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
      console.error('Error creating widget session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Return widget configuration
    return NextResponse.json({
      sessionToken: session.session_token,
      organizationId: settings.organization_id,
      organizationName: settings.organization?.name,
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

