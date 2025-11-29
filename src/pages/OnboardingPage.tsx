import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome to QSS Itinerary
            </h1>
            <p className="text-slate-600 mt-2">
              Let's set up your organization to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-slate-700">
                Organization Name
              </Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="e.g., My Villa Rentals"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                disabled={loading}
                className="h-12"
                autoFocus
              />
              <p className="text-xs text-slate-500">
                This is the name of your business or team. You can change it
                later.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25"
              disabled={loading || !organizationName.trim()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Organization"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">Signed in as {user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
