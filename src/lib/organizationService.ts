import { supabase } from "./supabase";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
  user?: {
    email: string;
  };
}

export interface OrganizationWithRole extends Organization {
  role: "owner" | "member";
}

/**
 * Get all organizations the current user belongs to
 */
export async function getUserOrganizations(): Promise<{
  data: OrganizationWithRole[] | null;
  error: unknown;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not authenticated" } };
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organization:organizations(*)
    `
    )
    .eq("user_id", user.id);

  if (error) {
    return { data: null, error };
  }

  // Transform the data to flatten the structure
  // Supabase returns organization as an object for single relations
  // Cast to unknown first to handle Supabase's complex typing
  type OrgMemberRow = { role: "owner" | "member"; organization: Organization };
  const organizations: OrganizationWithRole[] = ((data || []) as unknown as OrgMemberRow[])
    .filter((item) => item.organization)
    .map((item) => ({
      ...item.organization,
      role: item.role,
    }));

  return { data: organizations, error: null };
}

/**
 * Get a single organization by ID
 */
export async function getOrganization(
  organizationId: string
): Promise<{ data: Organization | null; error: unknown }> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  return { data, error };
}

/**
 * Create a new organization and add the current user as owner
 * Uses a database function to handle the atomic creation
 */
export async function createOrganization(
  name: string
): Promise<{ data: Organization | null; error: unknown }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not authenticated" } };
  }

  // Generate a slug from the name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 50);

  // Add a cryptographically random suffix to ensure uniqueness
  const randomBytes = crypto.getRandomValues(new Uint8Array(4));
  const randomSuffix = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const uniqueSlug = `${slug}-${randomSuffix}`;

  // Use the database function to create org and add owner atomically
  const { data, error } = await supabase
    .rpc("create_organization_with_owner", {
      org_name: name,
      org_slug: uniqueSlug,
    })
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: data as Organization, error: null };
}

/**
 * Update an organization's details (owner only)
 */
export async function updateOrganization(
  organizationId: string,
  updates: Partial<Pick<Organization, "name">>
): Promise<{ data: Organization | null; error: unknown }> {
  const { data, error } = await supabase
    .from("organizations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", organizationId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete an organization (owner only)
 */
export async function deleteOrganization(
  organizationId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", organizationId);

  return { error };
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<{ data: OrganizationMember[] | null; error: unknown }> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return { data, error };
}

/**
 * Invite a new member to an organization by email (owner only)
 * Note: In a real app, this would send an email invitation.
 * For now, it adds the user directly if they exist.
 */
export async function inviteMember(
  _organizationId: string,
  _email: string,
  _role: "owner" | "member" = "member"
): Promise<{ data: OrganizationMember | null; error: unknown }> {
  // Find user by email using the admin API or a custom function
  // For now, we'll need to use a database function or handle this differently
  // since we can't directly query auth.users from the client

  // This is a simplified implementation - in production you'd want to:
  // 1. Send an email invitation
  // 2. Create a pending invitation record
  // 3. Accept the invitation when the user clicks the link

  return {
    data: null,
    error: {
      message:
        "Email invitations not yet implemented. Users must be added by user ID.",
    },
  };
}

/**
 * Add a member to an organization by user ID (owner only)
 */
export async function addMember(
  organizationId: string,
  userId: string,
  role: "owner" | "member" = "member"
): Promise<{ data: OrganizationMember | null; error: unknown }> {
  const { data, error } = await supabase
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update a member's role (owner only)
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: "owner" | "member"
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  return { error };
}

/**
 * Remove a member from an organization (owner only, or self-remove)
 */
export async function removeMember(
  organizationId: string,
  userId: string
): Promise<{ error: unknown }> {
  // Check if this is the last owner
  const { data: owners } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "owner");

  if (owners && owners.length === 1 && owners[0].user_id === userId) {
    return {
      error: {
        message:
          "Cannot remove the last owner. Transfer ownership first or delete the organization.",
      },
    };
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  return { error };
}

/**
 * Check if the current user is an owner of an organization
 */
export async function isOrganizationOwner(
  organizationId: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  return data?.role === "owner";
}
