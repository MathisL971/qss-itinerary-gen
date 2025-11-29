import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  updateOrganization,
  getOrganizationMembers,
  removeMember,
  updateMemberRole,
  isOrganizationOwner,
} from "@/lib/organizationService";
import type { OrganizationMember } from "@/lib/organizationService";
import { Loader2, Save, Trash2, Shield, User, AlertCircle } from "lucide-react";

export function OrganizationSettingsPage() {
  const { currentOrganization, user, refreshOrganizations } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  const loadData = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setOrgName(currentOrganization.name);

    // Check if user is owner
    const ownerStatus = await isOrganizationOwner(currentOrganization.id);
    setIsOwner(ownerStatus);

    // Load members
    const { data: membersData } = await getOrganizationMembers(currentOrganization.id);
    if (membersData) {
      setMembers(membersData);
    }

    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!currentOrganization || !orgName.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await updateOrganization(currentOrganization.id, {
      name: orgName.trim(),
    });

    if (updateError) {
      const errorMessage = typeof updateError === 'object' && updateError !== null && 'message' in updateError
        ? (updateError as { message: string }).message
        : "Failed to update organization name";
      setError(errorMessage);
    } else {
      setSuccess("Organization name updated successfully");
      await refreshOrganizations();
    }

    setSaving(false);
  };

  const handleRemoveMember = async (_memberId: string, memberUserId: string) => {
    if (!currentOrganization) return;
    
    if (!confirm("Are you sure you want to remove this member?")) return;

    const { error: removeError } = await removeMember(currentOrganization.id, memberUserId);
    
    if (removeError) {
      const errorMessage = typeof removeError === 'object' && removeError !== null && 'message' in removeError
        ? (removeError as { message: string }).message
        : "Failed to remove member";
      setError(errorMessage);
    } else {
      setSuccess("Member removed successfully");
      loadData();
    }
  };

  const handleToggleRole = async (_memberId: string, memberUserId: string, currentRole: string) => {
    if (!currentOrganization) return;
    
    const newRole = currentRole === "owner" ? "member" : "owner";
    
    // Prevent demoting the last owner
    if (currentRole === "owner") {
      const ownerCount = members.filter(m => m.role === "owner").length;
      if (ownerCount <= 1) {
        setError("Cannot demote the last owner. Transfer ownership first.");
        return;
      }
    }

    const { error: updateError } = await updateMemberRole(
      currentOrganization.id,
      memberUserId,
      newRole as "owner" | "member"
    );

    if (updateError) {
      const errorMessage = typeof updateError === 'object' && updateError !== null && 'message' in updateError
        ? (updateError as { message: string }).message
        : "Failed to update member role";
      setError(errorMessage);
    } else {
      setSuccess(`Member role updated to ${newRole}`);
      loadData();
    }
  };

  if (!currentOrganization) {
    return (
      <Layout>
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center text-muted-foreground">
            No organization selected
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-wide uppercase">
            Organization Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization details and members
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Organization Details */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Organization Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={!isOwner}
                      className="max-w-md"
                    />
                    {isOwner && (
                      <Button onClick={handleSaveName} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span className="ml-2">Save</span>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Organization ID</Label>
                  <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded max-w-md">
                    {currentOrganization.id}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <>
                        <Shield className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">Owner</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Member</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Members</h2>
                <span className="text-sm text-muted-foreground">
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      {isOwner && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-sm">
                          {member.user_id === user?.id ? (
                            <span className="flex items-center gap-2">
                              {member.user_id.substring(0, 8)}...
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            </span>
                          ) : (
                            `${member.user_id.substring(0, 8)}...`
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                              member.role === "owner"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {member.role === "owner" ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        {isOwner && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {member.user_id !== user?.id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleRole(member.id, member.user_id, member.role)
                                    }
                                    title={
                                      member.role === "owner"
                                        ? "Demote to member"
                                        : "Promote to owner"
                                    }
                                  >
                                    {member.role === "owner" ? (
                                      <User className="h-4 w-4" />
                                    ) : (
                                      <Shield className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() =>
                                      handleRemoveMember(member.id, member.user_id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!isOwner && (
                <p className="text-sm text-muted-foreground mt-4">
                  Only organization owners can manage members.
                </p>
              )}
            </div>

            {/* Leave Organization */}
            {!isOwner && (
              <div className="bg-white border border-red-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-700 mb-2">
                  Leave Organization
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  You will lose access to all resources in this organization.
                </p>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!user || !currentOrganization) return;
                    if (
                      !confirm(
                        "Are you sure you want to leave this organization? You will lose access to all resources."
                      )
                    )
                      return;

                    const { error: leaveError } = await removeMember(
                      currentOrganization.id,
                      user.id
                    );
                    if (leaveError) {
                      const errorMessage = typeof leaveError === 'object' && leaveError !== null && 'message' in leaveError
                        ? (leaveError as { message: string }).message
                        : "Failed to leave organization";
                      setError(errorMessage);
                    } else {
                      await refreshOrganizations();
                    }
                  }}
                >
                  Leave Organization
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

