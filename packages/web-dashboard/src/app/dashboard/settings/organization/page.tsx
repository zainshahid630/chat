'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Palette, Users, Save, Loader2, UserPlus, Mail, Shield } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Organization, User as ChatDeskUser } from '@chatdesk/shared';

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const supabase = createBrowserClient();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    website: '',
    logo_url: '',
  });

  // Branding state
  const [brandingData, setBrandingData] = useState({
    primaryColor: '#3B82F6', // Default blue
    companyName: '',
  });

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Members state
  const [members, setMembers] = useState<ChatDeskUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'agent' as 'org_admin' | 'agent',
    full_name: '',
  });

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No session found');
        }

        // Fetch organization via API
        const response = await fetch('/api/organizations', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }

        const { organization: org } = await response.json();

        if (org) {
          setOrganization(org);
          setFormData({
            name: org.name || '',
            slug: org.slug || '',
            website: org.website || '',
            logo_url: org.logo_url || '',
          });
          setLogoPreview(org.logo_url || '');

          // Load branding settings
          if (org.settings?.branding) {
            setBrandingData({
              primaryColor: org.settings.branding.primaryColor || '#3B82F6',
              companyName: org.settings.branding.companyName || org.name || '',
            });
          } else {
            setBrandingData({
              primaryColor: '#3B82F6',
              companyName: org.name || '',
            });
          }
        }
      } catch (err: any) {
        console.error('Error fetching organization:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [user]);

  // Fetch members when organization is loaded
  useEffect(() => {
    const fetchMembers = async () => {
      if (!organization) return;

      try {
        setLoadingMembers(true);

        // Get session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(`/api/organizations/${organization.id}/members`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }

        const { members: orgMembers } = await response.json();
        setMembers(orgMembers || []);
      } catch (err: any) {
        console.error('Error fetching members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [organization]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleBrandingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBrandingData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !organization) return null;

    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${organization.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!user) throw new Error('Not authenticated');

      // Validate
      if (!formData.name.trim()) {
        throw new Error('Organization name is required');
      }
      if (!formData.slug.trim()) {
        throw new Error('Organization slug is required');
      }

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      if (organization) {
        // Update existing organization
        const response = await fetch(`/api/organizations/${organization.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            website: formData.website || null,
            logo_url: formData.logo_url || null,
          }),
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || 'Failed to update organization');
        }

        const { organization: updatedOrg } = await response.json();
        setOrganization(updatedOrg);
        setSuccess('Organization updated successfully!');
      } else {
        // Create new organization (super_admin only)
        if (user.role !== 'super_admin') {
          throw new Error('Only super admins can create organizations');
        }

        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            website: formData.website || null,
            logo_url: formData.logo_url || null,
          }),
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || 'Failed to create organization');
        }

        const { organization: newOrg } = await response.json();
        setOrganization(newOrg);
        setSuccess('Organization created successfully!');

        // Reload the page to update user context
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      console.error('Error saving organization:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!user || !organization) throw new Error('Not authenticated or no organization');

      // Upload logo if changed
      let logoUrl = organization.logo_url;
      if (logoFile) {
        logoUrl = await handleUploadLogo();
      }

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      // Update organization with branding settings
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          logo_url: logoUrl,
          settings: {
            ...organization.settings,
            branding: {
              primaryColor: brandingData.primaryColor,
              companyName: brandingData.companyName,
              logoUrl: logoUrl,
            },
          },
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to update branding');
      }

      const { organization: updatedOrg } = await response.json();
      setOrganization(updatedOrg);
      setLogoFile(null);
      setSuccess('Branding updated successfully!');
    } catch (err: any) {
      console.error('Error saving branding:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!user || !organization) throw new Error('Not authenticated or no organization');

      // Validate
      if (!inviteData.email.trim()) {
        throw new Error('Email is required');
      }

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      // Invite member via API
      const response = await fetch(`/api/organizations/${organization.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to invite member');
      }

      const { member } = await response.json();
      setMembers(prev => [member, ...prev]);
      setShowInviteForm(false);
      setInviteData({ email: '', role: 'agent', full_name: '' });
      setSuccess('Member invited successfully!');
    } catch (err: any) {
      console.error('Error inviting member:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Check permissions
  if (user?.role !== 'super_admin' && user?.role !== 'org_admin') {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              You don't have permission to access organization settings.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization profile, branding, and members
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Building2 className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Palette className="mr-2 h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGeneral} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Acme Inc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="acme-inc"
                      required
                      pattern="[a-z0-9-]+"
                    />
                    <p className="text-sm text-gray-500">
                      Used in URLs. Only lowercase letters, numbers, and hyphens.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Customize your organization's appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveBranding} className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Organization Logo</Label>
                    <div className="flex items-start gap-4">
                      {/* Logo Preview */}
                      <div className="flex-shrink-0">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-24 w-24 rounded-lg object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                            <Building2 className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="cursor-pointer"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Recommended: Square image, at least 200x200px, max 2MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name (for branding)</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={brandingData.companyName}
                      onChange={handleBrandingChange}
                      placeholder="Acme Inc."
                    />
                    <p className="text-sm text-gray-500">
                      This name will be displayed in the chat widget and customer-facing pages
                    </p>
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="primaryColor"
                        name="primaryColor"
                        type="color"
                        value={brandingData.primaryColor}
                        onChange={handleBrandingChange}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={brandingData.primaryColor}
                        onChange={(e) => setBrandingData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      This color will be used for buttons, links, and accents in the chat widget
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="bg-white rounded-lg shadow-lg max-w-sm mx-auto">
                        {/* Chat Widget Header Preview */}
                        <div
                          className="p-4 rounded-t-lg text-white"
                          style={{ backgroundColor: brandingData.primaryColor }}
                        >
                          <div className="flex items-center gap-3">
                            {logoPreview && (
                              <img
                                src={logoPreview}
                                alt="Logo"
                                className="h-8 w-8 rounded-full object-cover bg-white"
                              />
                            )}
                            <div>
                              <p className="font-semibold">
                                {brandingData.companyName || 'Your Company'}
                              </p>
                              <p className="text-xs opacity-90">We typically reply in a few minutes</p>
                            </div>
                          </div>
                        </div>
                        {/* Chat Widget Body Preview */}
                        <div className="p-4 space-y-3">
                          <div className="text-sm text-gray-600">
                            <div className="bg-gray-100 rounded-lg p-3 inline-block">
                              Hi! How can we help you today?
                            </div>
                          </div>
                          <div className="text-sm text-right">
                            <div
                              className="rounded-lg p-3 inline-block text-white"
                              style={{ backgroundColor: brandingData.primaryColor }}
                            >
                              I have a question
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving || uploading}>
                      {saving || uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploading ? 'Uploading...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Branding
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization Members</CardTitle>
                    <CardDescription>
                      Manage users in your organization
                    </CardDescription>
                  </div>
                  {(user?.role === 'super_admin' || user?.role === 'org_admin') && (
                    <Button onClick={() => setShowInviteForm(!showInviteForm)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Invite Form */}
                {showInviteForm && (
                  <form onSubmit={handleInviteMember} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Invite New Member</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email *</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteData.email}
                          onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="user@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-name">Full Name</Label>
                        <Input
                          id="invite-name"
                          value={inviteData.full_name}
                          onChange={(e) => setInviteData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Role *</Label>
                        <select
                          id="invite-role"
                          value={inviteData.role}
                          onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as 'org_admin' | 'agent' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="agent">Agent</option>
                          <option value="org_admin">Organization Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Inviting...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {/* Members List */}
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">No members yet</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Invite team members to collaborate on customer support
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => (
                          <tr key={member.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {member.full_name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {member.full_name || 'No name'}
                                  </div>
                                  <div className="text-sm text-gray-500">{member.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900 capitalize">
                                  {member.role.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                member.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {member.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(member.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

