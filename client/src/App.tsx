import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Social from "@/pages/social";
import Teams from "@/pages/teams";
import Goals from "@/pages/goals";
import JoinTeam from "@/pages/join-team";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

function Router() {
  // Check if user has any goals to determine if onboarding is needed
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/goals"],
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/player/profile"],
  });

  // Show loading while checking user status
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

  // If user has no goals, show onboarding
  const needsOnboarding = !goals || (Array.isArray(goals) && goals.length === 0);

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
