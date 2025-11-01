import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/widget/settings - Get widget settings for organization
export async function GET(request: NextRequest) {
  try {
    // Get user from Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with organization
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only org_admin and super_admin can access widget settings
    if (!['org_admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get widget settings for organization
    const { data: settings, error: settingsError } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .single();

    if (settingsError) {
      // If no settings exist, create default settings
      if (settingsError.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('widget_settings')
          .insert({
            organization_id: userProfile.organization_id,
            enabled: true,
            primary_color: '#3B82F6',
            position: 'bottom-right',
            bubble_icon: 'chat',
            widget_title: 'Chat with us',
            greeting_message: 'Hi! How can we help you today?',
            auto_open: false,
            auto_open_delay: 5,
            show_agent_avatars: true,
            show_typing_indicator: true,
            play_notification_sound: true,
            business_hours: [],
            offline_message: 'We are currently offline. Leave a message and we will get back to you.',
            allowed_domains: [],
            enabled_department_ids: [],
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating widget settings:', createError);
          return NextResponse.json({ error: 'Failed to create widget settings' }, { status: 500 });
        }

        return NextResponse.json(newSettings);
      }

      console.error('Error fetching widget settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch widget settings' }, { status: 500 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in GET /api/widget/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/widget/settings - Update widget settings
export async function PUT(request: NextRequest) {
  try {
    // Get user from Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with organization
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only org_admin and super_admin can update widget settings
    if (!['org_admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Update widget settings
    const { data: settings, error: updateError } = await supabase
      .from('widget_settings')
      .update({
        enabled: body.enabled,
        primary_color: body.primary_color,
        position: body.position,
        widget_title: body.widget_title,
        greeting_message: body.greeting_message,
        auto_open: body.auto_open,
        auto_open_delay: body.auto_open_delay,
        show_agent_avatars: body.show_agent_avatars,
        show_typing_indicator: body.show_typing_indicator,
        play_notification_sound: body.play_notification_sound,
        offline_message: body.offline_message,
        business_hours: body.business_hours,
        allowed_domains: body.allowed_domains,
        default_department_id: body.default_department_id,
        enabled_department_ids: body.enabled_department_ids,
      })
      .eq('organization_id', userProfile.organization_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating widget settings:', updateError);
      return NextResponse.json({ error: 'Failed to update widget settings' }, { status: 500 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in PUT /api/widget/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

