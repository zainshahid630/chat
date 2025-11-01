'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Eye, Settings, Code, Palette, Users } from 'lucide-react';
import type { WidgetSettings } from '@chatdesk/shared/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export default function WidgetSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [supabase] = useState(() => createBrowserClient());

  // Fetch widget settings and departments
  useEffect(() => {
    if (!authLoading && user) {
      fetchSettings();
      fetchDepartments();
    } else if (!authLoading && !user) {
      setError('Please log in to access widget settings');
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in.');
      }

      console.log('Fetching widget settings with token...');
      const response = await fetch('/api/widget/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch widget settings');
      }

      const data = await response.json();
      console.log('Widget settings loaded:', data);
      setSettings(data);
    } catch (err: any) {
      console.error('Error fetching widget settings:', err);
      setError(err.message || 'Widget settings not found. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return;
      }

      const response = await fetch('/api/department', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments([]);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Get session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in.');
      }

      const response = await fetch('/api/widget/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primary_color: settings.primary_color,
          position: settings.position,
          widget_title: settings.widget_title,
          greeting_message: settings.greeting_message,
          auto_open: settings.auto_open,
          auto_open_delay: settings.auto_open_delay,
          show_agent_avatars: settings.show_agent_avatars,
          show_typing_indicator: settings.show_typing_indicator,
          play_notification_sound: settings.play_notification_sound,
          offline_message: settings.offline_message,
          enabled: settings.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getWidgetCode = () => {
    if (!settings) return '';

    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'http://localhost:3001';
    
    return `<!-- ChatDesk Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatDesk']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','chatdesk','${widgetUrl}/widget.js'));
  
  chatdesk('init', {
    widgetKey: '${settings.widget_key}'
  });
</script>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getWidgetCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading widget settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchSettings} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Widget settings not found. Please contact support.
          </AlertDescription>
        </Alert>
        <Button onClick={fetchSettings} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chat Widget</h1>
        <p className="text-gray-600 mt-2">
          Customize and embed the chat widget on your website
        </p>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="installation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="installation">
            <Code className="w-4 h-4 mr-2" />
            Installation
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <Settings className="w-4 h-4 mr-2" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Users className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Installation Tab */}
        <TabsContent value="installation">
          <Card>
            <CardHeader>
              <CardTitle>Installation Code</CardTitle>
              <CardDescription>
                Copy and paste this code before the closing &lt;/body&gt; tag on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Widget Key</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input value={settings.widget_key} readOnly className="font-mono text-sm" />
                  <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                    {settings.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Embed Code</Label>
                <div className="relative mt-2">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{getWidgetCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> The widget will only work on domains you've whitelisted in the security settings.
                  Leave the allowed domains empty to allow all domains (not recommended for production).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the widget looks on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="position">Position</Label>
                  <select
                    id="position"
                    value={settings.position}
                    onChange={(e) => setSettings({ ...settings, position: e.target.value as any })}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="widget_title">Widget Title</Label>
                <Input
                  id="widget_title"
                  value={settings.widget_title}
                  onChange={(e) => setSettings({ ...settings, widget_title: e.target.value })}
                  className="mt-2"
                  placeholder="Chat with us"
                />
              </div>

              <div>
                <Label htmlFor="greeting_message">Greeting Message</Label>
                <Textarea
                  id="greeting_message"
                  value={settings.greeting_message}
                  onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                  className="mt-2"
                  rows={3}
                  placeholder="Hi! How can we help you today?"
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>Behavior Settings</CardTitle>
              <CardDescription>
                Configure how the widget behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Widget Enabled</Label>
                  <p className="text-sm text-gray-600">Enable or disable the widget globally</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Open</Label>
                  <p className="text-sm text-gray-600">Automatically open the widget after a delay</p>
                </div>
                <Switch
                  checked={settings.auto_open}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_open: checked })}
                />
              </div>

              {settings.auto_open && (
                <div>
                  <Label htmlFor="auto_open_delay">Auto Open Delay (seconds)</Label>
                  <Input
                    id="auto_open_delay"
                    type="number"
                    min="0"
                    max="60"
                    value={settings.auto_open_delay}
                    onChange={(e) => setSettings({ ...settings, auto_open_delay: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Agent Avatars</Label>
                  <p className="text-sm text-gray-600">Display agent profile pictures in chat</p>
                </div>
                <Switch
                  checked={settings.show_agent_avatars}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_agent_avatars: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Typing Indicator</Label>
                  <p className="text-sm text-gray-600">Show when agents are typing</p>
                </div>
                <Switch
                  checked={settings.show_typing_indicator}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_typing_indicator: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notification Sound</Label>
                  <p className="text-sm text-gray-600">Play sound on new messages</p>
                </div>
                <Switch
                  checked={settings.play_notification_sound}
                  onCheckedChange={(checked) => setSettings({ ...settings, play_notification_sound: checked })}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Department Selection</CardTitle>
              <CardDescription>
                Choose which departments are available in the widget. If none are selected, all active departments will be shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {departments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No departments found.</p>
                  <p className="text-sm mt-2">Create departments first to enable them in the widget.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{dept.name}</div>
                        {dept.description && (
                          <div className="text-sm text-gray-500 mt-1">{dept.description}</div>
                        )}
                        {!dept.is_active && (
                          <Badge variant="secondary" className="mt-2">Inactive</Badge>
                        )}
                      </div>
                      <Switch
                        checked={
                          !settings.enabled_department_ids ||
                          settings.enabled_department_ids.length === 0 ||
                          settings.enabled_department_ids.includes(dept.id)
                        }
                        onCheckedChange={(checked) => {
                          const currentIds = settings.enabled_department_ids || [];
                          let newIds: string[];

                          if (checked) {
                            // Add department
                            newIds = [...currentIds, dept.id];
                          } else {
                            // Remove department
                            newIds = currentIds.filter((id: string) => id !== dept.id);
                          }

                          setSettings({ ...settings, enabled_department_ids: newIds });
                        }}
                        disabled={!dept.is_active}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Widget Preview</CardTitle>
              <CardDescription>
                See how the widget will look on your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-8 min-h-[500px] relative">
                <p className="text-gray-600 text-center">
                  Widget preview will be displayed here
                </p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  (Preview functionality coming soon)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}

