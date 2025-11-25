import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { AccommodationsPage } from "@/pages/AccommodationsPage";
import { ServiceProvidersPage } from "@/pages/ServiceProvidersPage";
import { StaysPage } from "@/pages/StaysPage";
import { StayDetailPage } from "@/pages/StayDetailPage";
import { EditItineraryPage } from "@/pages/EditItineraryPage";
import { SharedItineraryPage } from "@/pages/SharedItineraryPage";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <ClipLoader color="#1a1a1a" size={48} />
          <div className="text-muted-foreground font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/stays" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/stays"
        element={
          <ProtectedRoute>
            <StaysPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stays/:id"
        element={
          <ProtectedRoute>
            <StayDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stays/:stayId/itinerary/edit"
        element={
          <ProtectedRoute>
            <EditItineraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accommodations"
        element={
          <ProtectedRoute>
            <AccommodationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/providers"
        element={
          <ProtectedRoute>
            <ServiceProvidersPage />
          </ProtectedRoute>
        }
      />
      <Route path="/share/:token" element={<SharedItineraryPage />} />
      <Route path="*" element={<Navigate to="/stays" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
