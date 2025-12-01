import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { useAuth } from "@/contexts/AuthContext";
import { createOrganization } from "@/lib/organizationService";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshOrganizations } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);

    try {
      const { data, error: createError } = await createOrganization(
        organizationName.trim()
      );

      if (createError) {
        const errorMessage =
          typeof createError === "object" &&
          createError !== null &&
          "message" in createError
            ? (createError as { message: string }).message
            : "Failed to create organization";
        setError(errorMessage);
        return;
      }

      if (data) {
        // Refresh organizations in the auth context
        await refreshOrganizations();
        // Navigate to the main app
        navigate("/stays", { replace: true });
      }
    } catch (err) {
      setError("An unexpected error occurred");
      logger.error("Error creating organization:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4 animate-fade-in">
          <img
            src="/qss-villa-rental-logo.jpg"
            alt="QSS Villa Rental Saint Barth Logo"
            className="logo mx-auto mb-6"
          />
          <h1 className="text-5xl font-bold tracking-[0.05em] uppercase">
            Welcome
          </h1>
          <p className="text-muted-foreground mt-3 text-base">
            Let's set up your organization to get started
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-card border border-border rounded-lg p-10 shadow-sm animate-scale-in"
        >
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              type="text"
              placeholder="e.g., My Villa Rentals"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This is the name of your business or team. You can change it
              later.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !organizationName.trim()}
            size="lg"
          >
            {loading ? (
              <>
                <ClipLoader color="currentColor" size={16} />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Organization</span>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Signed in as {user?.email}
          </div>
        </form>
      </div>
    </div>
  );
}
