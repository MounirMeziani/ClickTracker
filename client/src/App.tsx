/**
 * MAIN APPLICATION COMPONENT
 * 
 * This is the root component that sets up routing and global providers.
 * 
 * DEPENDENCIES:
 * - wouter: Lightweight client-side routing
 * - @tanstack/react-query: Server state management and caching
 * - shadcn/ui: UI component library with Toaster for notifications
 * 
 * ARCHITECTURE NOTES:
 * - QueryClient handles all API requests and caching
 * - Router manages navigation between different app pages
 * - Toaster provides global notification system
 * 
 * ROUTING STRUCTURE:
 * - / : Home page (main productivity interface)
 * - /social : Social features and leaderboards
 * - /teams : Team management and collaboration
 * - /goals : Goal management interface
 * - /join/:code : Team invitation acceptance
 * - /onboarding : First-time user setup
 */
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Social from "@/pages/social";
import Teams from "@/pages/teams";
import Goals from "@/pages/goals";
import JoinTeam from "@/pages/join-team";
import Onboarding from "@/pages/onboarding";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Check if user has any goals to determine if onboarding is needed
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/goals"],
    enabled: isAuthenticated,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/player/profile"],
    enabled: isAuthenticated,
  });

  // Show loading while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show loading while checking user status for authenticated users
  if (goalsLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your experience...</p>
        </div>
      </div>
    );
  }

  // Check if user needs onboarding: no goals OR no active goal
  const needsOnboarding = !goals || 
    (Array.isArray(goals) && goals.length === 0) ||
    (Array.isArray(goals) && goals.length > 0 && !goals.some(goal => goal.isActive));

  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/join/:inviteCode" component={JoinTeam} />
      {needsOnboarding ? (
        <>
          <Route path="/" component={Onboarding} />
          <Route component={Onboarding} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/social" component={Social} />
          <Route path="/teams" component={Teams} />
          <Route path="/goals" component={Goals} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
