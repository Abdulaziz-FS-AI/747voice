'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserMonitoring {
  user_id: string;
  email: string;
  full_name: string;
  signup_date: string;
  max_assistants: number;
  max_minutes_total: number;
  current_usage_minutes: number;
  usage_percentage: number;
  minutes_remaining: number;
  active_assistants: number;
  expired_assistants: number;
  total_assistants_ever: number;
  account_status: 'NORMAL' | 'WARNING' | 'OVER_LIMIT' | 'AT_ASSISTANT_LIMIT' | 'SUSPENDED';
  admin_notes: string;
  limit_override_reason: string;
  last_limit_change_by: string;
  last_limit_change_at: string;
  suspension_reason: string;
  last_call_date: string;
  total_calls: number;
  quick_actions: {
    can_increase_assistants: boolean;
    can_increase_minutes: boolean;
    needs_cleanup: boolean;
  };
}

export function UserLimitsManager() {
  const [users, setUsers] = useState<UserMonitoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserMonitoring | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [newAssistantLimit, setNewAssistantLimit] = useState<number>(3);
  const [newMinutesLimit, setNewMinutesLimit] = useState<number>(10);
  const [adminEmail, setAdminEmail] = useState('admin@voicematrix.ai');
  const [reason, setReason] = useState('');
  const [suspendUser, setSuspendUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/user-limits?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: UserMonitoring) => {
    setSelectedUser(user);
    setNewAssistantLimit(user.max_assistants);
    setNewMinutesLimit(user.max_minutes_total);
    setSuspendUser(user.account_status === 'SUSPENDED');
    setReason('');
    setIsEditDialogOpen(true);
  };

  const updateUserLimits = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading('updating');
      const response = await fetch('/api/admin/user-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.user_id,
          maxAssistants: newAssistantLimit,
          maxMinutes: newMinutesLimit,
          adminEmail,
          reason,
          suspendUser
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Show VAPI deletion queue if assistants were deleted
        if (data.vapiDeletionQueue?.length > 0) {
          alert(`Successfully updated limits. ${data.vapiDeletionQueue.length} assistants marked for VAPI deletion.`);
        } else {
          alert('User limits updated successfully!');
        }
        
        await fetchUsers();
        setIsEditDialogOpen(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating limits:', error);
      alert('Failed to update user limits');
    } finally {
      setActionLoading(null);
    }
  };

  const resetUserUsage = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s usage to 0?')) return;

    try {
      setActionLoading(userId);
      const response = await fetch('/api/admin/user-limits/reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          adminEmail,
          reason: 'Admin manual reset'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Usage reset successfully! ${data.data.assistants_reactivated} assistants reactivated.`);
        await fetchUsers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error resetting usage:', error);
      alert('Failed to reset usage');
    } finally {
      setActionLoading(null);
    }
  };

  const enforceAllLimits = async () => {
    if (!confirm('Run limit enforcement across ALL users? This will delete assistants from VAPI.')) return;

    try {
      setActionLoading('enforcing');
      const response = await fetch('/api/admin/enforce-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Enforcement complete! ${data.summary.assistantsMarkedForDeletion} assistants processed, ${data.summary.vapiDeletionsSuccessful} successfully deleted from VAPI.`);
        await fetchUsers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error enforcing limits:', error);
      alert('Failed to enforce limits');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUSPENDED': return 'bg-red-500';
      case 'OVER_LIMIT': return 'bg-orange-500';
      case 'AT_ASSISTANT_LIMIT': return 'bg-yellow-500';
      case 'WARNING': return 'bg-yellow-400';
      default: return 'bg-green-500';
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            User Limits Manager
            <div className="flex gap-2">
              <Button 
                onClick={enforceAllLimits}
                variant="destructive"
                disabled={actionLoading === 'enforcing'}
              >
                {actionLoading === 'enforcing' ? 'Enforcing...' : 'Enforce All Limits'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="OVER_LIMIT">Over Limit</SelectItem>
                <SelectItem value="AT_ASSISTANT_LIMIT">At Assistant Limit</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div>Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Assistants</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || 'No Name'}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.account_status)}>
                        {user.account_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.current_usage_minutes}/{user.max_minutes_total} min
                        <div className="text-xs text-gray-500">
                          ({user.usage_percentage}%)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.active_assistants}/{user.max_assistants} active
                        <div className="text-xs text-gray-500">
                          {user.total_assistants_ever} total
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        A: {user.max_assistants}, M: {user.max_minutes_total}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog 
                          open={isEditDialogOpen && selectedUser?.user_id === user.user_id}
                          onOpenChange={setIsEditDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update User Limits</DialogTitle>
                              <DialogDescription>
                                {selectedUser?.email} - Current: {selectedUser?.max_assistants} assistants, {selectedUser?.max_minutes_total} minutes
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Assistant Limit</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={newAssistantLimit}
                                    onChange={(e) => setNewAssistantLimit(Number(e.target.value))}
                                  />
                                </div>
                                <div>
                                  <Label>Minutes Limit</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={newMinutesLimit}
                                    onChange={(e) => setNewMinutesLimit(Number(e.target.value))}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Admin Email</Label>
                                <Input
                                  value={adminEmail}
                                  onChange={(e) => setAdminEmail(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Reason</Label>
                                <Textarea
                                  placeholder="Reason for limit change..."
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="suspend"
                                  checked={suspendUser}
                                  onChange={(e) => setSuspendUser(e.target.checked)}
                                />
                                <Label htmlFor="suspend">Suspend User</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={updateUserLimits}
                                disabled={actionLoading === 'updating'}
                              >
                                {actionLoading === 'updating' ? 'Updating...' : 'Update Limits'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => resetUserUsage(user.user_id)}
                          disabled={actionLoading === user.user_id}
                        >
                          {actionLoading === user.user_id ? 'Resetting...' : 'Reset Usage'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && !loading && (
        <Alert>
          <AlertDescription>
            No users found matching your criteria.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}