'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Mail,
  Shield,
  Building2
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User, Department } from '@chatdesk/shared';

interface AgentWithDepartments extends User {
  agent_departments?: Array<{
    id: string;
    department_id: string;
    departments: {
      id: string;
      name: string;
    };
  }>;
}

export default function AgentsPage() {
  const { user } = useAuth();

  const [agents, setAgents] = useState<AgentWithDepartments[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentWithDepartments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDepartmentsDialog, setShowDepartmentsDialog] = useState(false);
  
  const [selectedAgent, setSelectedAgent] = useState<AgentWithDepartments | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'agent', department_ids: [] as string[] });
  const [editForm, setEditForm] = useState({ full_name: '', is_active: true });
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // Helper function to get access token
  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Fetch agents
  useEffect(() => {
    if (user) {
      fetchAgents();
      fetchDepartments();
    }
  }, [user]);

  // Filter agents
  useEffect(() => {
    if (searchQuery || roleFilter !== 'all' || statusFilter !== 'all') {
      const query = searchQuery.toLowerCase();
      setFilteredAgents(
        agents.filter(
          (agent) => {
            const matchesSearch = agent.full_name?.toLowerCase().includes(query) ||
              agent.email.toLowerCase().includes(query);
            const matchesRole = roleFilter === 'all' || agent.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || 
              (statusFilter === 'active' && agent.is_active) ||
              (statusFilter === 'inactive' && !agent.is_active);
            return matchesSearch && matchesRole && matchesStatus;
          }
        )
      );
    } else {
      setFilteredAgents(agents);
    }
  }, [searchQuery, roleFilter, statusFilter, agents]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch('/api/department', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleInviteAgent = async () => {
    try {
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to invite agent');
      }

      setSuccess('Agent invited successfully');
      setShowInviteDialog(false);
      setInviteForm({ email: '', full_name: '', role: 'agent', department_ids: [] });
      fetchAgents();
    } catch (err: any) {
      console.error('Error inviting agent:', err);
      setError(err.message || 'Failed to invite agent');
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    try {
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update agent');
      }

      setSuccess('Agent updated successfully');
      setShowEditDialog(false);
      fetchAgents();
    } catch (err: any) {
      console.error('Error updating agent:', err);
      setError(err.message || 'Failed to update agent');
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    try {
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/agents/${selectedAgent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete agent');
      }

      setSuccess('Agent deleted successfully');
      setShowDeleteDialog(false);
      fetchAgents();
    } catch (err: any) {
      console.error('Error deleting agent:', err);
      setError(err.message || 'Failed to delete agent');
    }
  };

  const handleUpdateDepartments = async () => {
    if (!selectedAgent) return;

    try {
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/agents/${selectedAgent.id}/departments`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ department_ids: selectedDepartmentIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update departments');
      }

      setSuccess('Departments updated successfully');
      setShowDepartmentsDialog(false);
      fetchAgents();
    } catch (err: any) {
      console.error('Error updating departments:', err);
      setError(err.message || 'Failed to update departments');
    }
  };

  const openEditDialog = (agent: AgentWithDepartments) => {
    setSelectedAgent(agent);
    setEditForm({
      full_name: agent.full_name || '',
      is_active: agent.is_active,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (agent: AgentWithDepartments) => {
    setSelectedAgent(agent);
    setShowDeleteDialog(true);
  };

  const openDepartmentsDialog = (agent: AgentWithDepartments) => {
    setSelectedAgent(agent);
    const currentDeptIds = agent.agent_departments?.map(ad => ad.department_id) || [];
    setSelectedDepartmentIds(currentDeptIds);
    setShowDepartmentsDialog(true);
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartmentIds(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  // Check if user has permission to manage agents
  const canManage = user?.role === 'super_admin' || user?.role === 'org_admin';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
            <p className="text-muted-foreground mt-1">
              Manage your support agents and their permissions
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Agent
            </Button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="org_admin">Org Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agents ({filteredAgents.length})</CardTitle>
            <CardDescription>
              View and manage all agents in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAgents.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No agents found"
                description={searchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? "Try adjusting your filters" 
                  : "Get started by inviting your first agent"}
                action={canManage ? {
                  label: 'Invite Agent',
                  onClick: () => setShowInviteDialog(true)
                } : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Departments</TableHead>
                      <TableHead>Status</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">
                          {agent.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>{agent.email}</TableCell>
                        <TableCell>
                          <Badge variant={agent.role === 'org_admin' ? 'default' : 'secondary'}>
                            <Shield className="h-3 w-3 mr-1" />
                            {agent.role === 'org_admin' ? 'Admin' : 'Agent'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {agent.agent_departments && agent.agent_departments.length > 0 ? (
                              agent.agent_departments.map((ad) => (
                                <Badge key={ad.id} variant="outline" className="text-xs">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {ad.departments.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No departments</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                            {agent.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDepartmentsDialog(agent)}
                              >
                                <Building2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(agent)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(agent)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite Agent Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Agent</DialogTitle>
              <DialogDescription>
                Send an invitation to a new agent to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="org_admin">Org Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Departments (Optional)</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`dept-${dept.id}`}
                        checked={inviteForm.department_ids.includes(dept.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInviteForm({
                              ...inviteForm,
                              department_ids: [...inviteForm.department_ids, dept.id]
                            });
                          } else {
                            setInviteForm({
                              ...inviteForm,
                              department_ids: inviteForm.department_ids.filter(id => id !== dept.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`dept-${dept.id}`} className="text-sm">
                        {dept.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteAgent} disabled={!inviteForm.email}>
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Agent Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update agent information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_full_name">Full Name</Label>
                <Input
                  id="edit_full_name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit_is_active">Active Status</Label>
                <Switch
                  id="edit_is_active"
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAgent}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Agent Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Agent</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this agent? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              <p className="font-medium">{selectedAgent?.full_name || selectedAgent?.email}</p>
              <p className="text-sm mt-1">All conversations and data associated with this agent will remain, but they will no longer have access to the system.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAgent}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Departments Dialog */}
        <Dialog open={showDepartmentsDialog} onOpenChange={setShowDepartmentsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Departments</DialogTitle>
              <DialogDescription>
                Assign {selectedAgent?.full_name || selectedAgent?.email} to departments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {departments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No departments available</p>
              ) : (
                departments.map((dept) => (
                  <div key={dept.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                    <input
                      type="checkbox"
                      id={`assign-dept-${dept.id}`}
                      checked={selectedDepartmentIds.includes(dept.id)}
                      onChange={() => toggleDepartment(dept.id)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`assign-dept-${dept.id}`} className="flex-1 text-sm cursor-pointer">
                      <div className="font-medium">{dept.name}</div>
                      {dept.description && (
                        <div className="text-xs text-muted-foreground">{dept.description}</div>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDepartmentsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateDepartments}>
                <Building2 className="h-4 w-4 mr-2" />
                Update Departments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

