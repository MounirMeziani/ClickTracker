import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MousePointer, 
  CalendarDays, 
  Calendar, 
  Trophy, 
  BarChart3, 
  Flame, 
  Plus, 
  Minus, 
  Star, 
  Crown, 
  Target,
  Zap,
  Award,
  Shirt,
  Users
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

interface TodayData {
  clicks: number;
  date: string;
}

interface WeeklyData {
  totalClicks: number;
  averageClicks: number;
  daysWithClicks: number;
}

interface MonthlyData {
  totalClicks: number;
  averageClicks: number;
  daysWithClicks: number;
  daysInMonth: number;
}

interface AllTimeData {
  totalClicks: number;
  daysActive: number;
  bestDay: number;
  averageClicks: number;
}

interface DayData {
  date: string;
  clicks: number;
  dayName: string;
  shortDate: string;
  isToday: boolean;
}

interface PlayerProfile {
  id: number;
  currentLevel: number;
  totalClicks: number;
  currentSkin: string;
  unlockedSkins: string[];
  achievements: string[];
  dailyChallengeCompleted: boolean;
  lastChallengeDate?: string;
  streakCount: number;
}

interface GameData {
  profile: PlayerProfile;
  levelData: {
    name: string;
    title: string;
    clicksRequired: number;
    description: string;
  };
  nextLevelData?: {
    name: string;
    title: string;
    clicksRequired: number;
    description: string;
  };
  availableSkins: Array<{
    id: string;
    name: string;
    description: string;
    unlockLevel: number;
    color: string;
    unlocked: boolean;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
  }>;
}

interface DailyChallenge {
  id: number;
  date: string;
  challengeType: string;
  targetValue: number;
  description: string;
  reward: string;
}

// Goal-specific level calculation functions
function getGoalLevel(totalClicks: number): number {
  if (totalClicks >= 100) return Math.floor(totalClicks / 100) + 1;
  return 1;
}

function getGoalLevelTitle(totalClicks: number): string {
  const level = getGoalLevel(totalClicks);
  if (level === 1) return "Rookie";
  if (level <= 3) return "Amateur";
  if (level <= 6) return "Semi-Pro";
  if (level <= 10) return "Professional";
  return "Elite";
}

export default function Home() {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAllGoalsData, setShowAllGoalsData] = useState(false);

  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: todayData, isLoading: todayLoading } = useQuery<TodayData>({
    queryKey: ["/api/clicks/today"],
  });

  const { data: weeklyData } = useQuery<WeeklyData>({
    queryKey: ["/api/clicks/weekly"],
  });

  const { data: monthlyData } = useQuery<MonthlyData>({
    queryKey: ["/api/clicks/monthly"],
  });

  const { data: allTimeData } = useQuery<AllTimeData>({
    queryKey: ["/api/clicks/all-time"],
  });

  const { data: last7DaysData } = useQuery<DayData[]>({
    queryKey: ["/api/clicks/last-7-days"],
  });

  const { data: gameData } = useQuery<GameData>({
    queryKey: ["/api/player/profile"],
  });

  const { data: dailyChallenge } = useQuery<DailyChallenge>({
    queryKey: ["/api/challenge/daily"],
  });

  const { data: goals } = useQuery({
    queryKey: ["/api/goals"],
    refetchOnMount: "always",
  });

  const { data: activeGoal } = useQuery({
    queryKey: ["/api/goals/active"],
    refetchOnMount: "always",
  });

  const { data: goalTodayData } = useQuery({
    queryKey: ["/api/goals/active/today"],
    enabled: !!activeGoal,
    refetchOnMount: "always",
  });

  // Use first goal as fallback if no active goal is set
  const currentGoal = activeGoal || (Array.isArray(goals) && goals.length > 0 ? goals[0] : null);

  // Fetch goal-specific Last 7 Days data
  const { data: goalLast7DaysData } = useQuery<DayData[]>({
    queryKey: ["/api/goals/active/last-7-days"],
    enabled: !!activeGoal && !showAllGoalsData,
    refetchOnMount: "always",
  });

  const incrementMutation = useMutation({
    mutationFn: () => {
      console.log("=== HOME INCREMENT MUTATION START ===");
      console.log("Current goal:", currentGoal);
      
      // Use goal-specific endpoint if there's a current goal
      if (currentGoal?.id) {
        console.log("Using goal-specific endpoint for goal ID:", currentGoal.id);
        return fetch(`/api/goals/${currentGoal.id}/click`, { method: "POST" }).then(res => {
          console.log("Goal-specific response status:", res.status);
          return res.json();
        });
      }
      console.log("Using general click increment endpoint");
      return apiRequest("POST", "/api/clicks/increment");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/last-7-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active/last-7-days"] });
      
      // Show level up notification
      if (data.levelUp && data.levelData) {
        toast({
          title: "🏀 LEVEL UP!",
          description: `Welcome to ${data.levelData.title}! You're now a ${data.levelData.name}!`,
          variant: "default",
        });
      }

      // Show skin change notification
      if (data.skinChanged) {
        toast({
          title: "👕 New Uniform Unlocked!",
          description: `You've upgraded to a new uniform! Check out your new look.`,
          variant: "default",
        });
      }

      // Show new achievements
      if (data.newAchievements && data.newAchievements.length > 0) {
        setTimeout(() => {
          data.newAchievements.forEach((achievement: string, index: number) => {
            setTimeout(() => {
              toast({
                title: "🏆 Achievement Unlocked!",
                description: achievement,
                variant: "default",
              });
            }, index * 1500);
          });
        }, 1000);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record shot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: () => {
      console.log("=== HOME DECREMENT MUTATION START ===");
      console.log("Active goal:", activeGoal);
      
      // Use goal-specific endpoint if there's an active goal
      if ((activeGoal as any)?.id) {
        console.log("Using goal-specific decrement endpoint for goal ID:", (activeGoal as any).id);
        return fetch(`/api/goals/${(activeGoal as any).id}/decrement`, { method: "POST" }).then(res => {
          console.log("Goal-specific decrement response status:", res.status);
          return res.json();
        });
      }
      console.log("Using general click decrement endpoint");
      return apiRequest("POST", "/api/clicks/decrement");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/last-7-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active/last-7-days"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to decrease clicks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleIncrement = () => {
    if (isAnimating || incrementMutation.isPending) return;
    
    setIsAnimating(true);
    incrementMutation.mutate();
    
    // Haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const handleDecrement = () => {
    if (isAnimating || decrementMutation.isPending || (todayData?.clicks || 0) <= 0) return;
    
    setIsAnimating(true);
    decrementMutation.mutate();
    
    // Light haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleIncrement();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const calculateStreak = () => {
    if (!last7DaysData) return 0;
    let streak = 0;
    // Count consecutive days with clicks starting from today
    for (let i = last7DaysData.length - 1; i >= 0; i--) {
      if (last7DaysData[i].clicks > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getMaxClicks = () => {
    if (!last7DaysData) return 1;
    return Math.max(...last7DaysData.map(day => day.clicks), 1);
  };

  if (todayLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your click counter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Modern Navigation */}
        <nav className="flex justify-between items-center mb-8 bg-white/70 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/20 shadow-lg shadow-blue-100/25">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="text-white" size={24} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Productivity Arena</h1>
              <div className="text-xs text-gray-500 font-medium">Championship Mode Active</div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link href="/goals">
              <Button variant="outline" className="flex items-center gap-2 border-gray-200/60 hover:border-orange-300 hover:bg-orange-50/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Target size={16} />
                Goals
              </Button>
            </Link>
            <Link href="/social">
              <Button variant="outline" className="flex items-center gap-2 border-gray-200/60 hover:border-blue-300 hover:bg-blue-50/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Users size={16} />
                Community
              </Button>
            </Link>
            <Link href="/teams">
              <Button variant="outline" className="flex items-center gap-2 border-gray-200/60 hover:border-purple-300 hover:bg-purple-50/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Users size={16} />
                Teams
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/api/logout'}
              className="text-gray-600 hover:text-gray-900 border-gray-200/60 hover:border-red-300 hover:bg-red-50/80 transition-all duration-300"
            >
              Logout
            </Button>
          </div>
        </nav>

        {/* Enhanced Hero Header */}
        <header className="text-center mb-8">
          <Card className="border-white/30 bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-xl shadow-2xl shadow-blue-100/50 overflow-hidden relative">
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 ${['bg-orange-300', 'bg-blue-300', 'bg-purple-300'][i % 3]} rounded-full opacity-30 animate-bounce`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>

            <CardContent className="pt-8 pb-6 relative z-10">
              <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-6">
                {/* Avatar and Main Info */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div 
                      className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white/60 transition-all duration-700 hover:scale-110 hover:rotate-6 cursor-pointer group"
                      style={{ 
                        backgroundColor: gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#6B7280',
                        boxShadow: `0 20px 40px ${gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#6B7280'}30`
                      }}
                    >
                      <Crown className="text-white drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" size={40} />
                    </div>
                    {/* Level badge */}
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white">
                      L{currentGoal ? getGoalLevel(currentGoal.totalClicks || 0) : gameData?.profile?.currentLevel || 1}
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl animate-pulse opacity-20 bg-gradient-to-r from-orange-400 to-blue-400"></div>
                  </div>
                  
                  <div className="text-left">
                    <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent mb-2">
                      {currentGoal ? `${getGoalLevelTitle(currentGoal.totalClicks || 0)} ${currentGoal.name}` : "Basketball Training"}
                    </h1>
                    <p className="text-lg font-semibold text-gray-600 mb-3">
                      {currentGoal ? `${currentGoal.name} Champion` : `${gameData?.levelData?.name || "Rookie"} Player`} • Level {currentGoal ? getGoalLevel(currentGoal.totalClicks || 0) : gameData?.profile?.currentLevel || 1}
                    </p>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                        style={{ backgroundColor: gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#6B7280' }}
                      ></div>
                      <span className="text-sm font-medium text-gray-600">
                        {gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.name || "Rookie Uniform"}
                      </span>
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-0">
                        {gameData?.levelData?.description || "Rising Star"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 lg:gap-6">
                  <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/40 hover:bg-white/80 transition-all duration-300">
                    <div className="text-2xl font-bold text-orange-600">{todayData?.clicks || 0}</div>
                    <div className="text-xs text-gray-600 font-medium">Today</div>
                  </div>
                  <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/40 hover:bg-white/80 transition-all duration-300">
                    <div className="text-2xl font-bold text-blue-600">{weeklyData?.totalClicks || 0}</div>
                    <div className="text-xs text-gray-600 font-medium">This Week</div>
                  </div>
                  <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/40 hover:bg-white/80 transition-all duration-300">
                    <div className="text-2xl font-bold text-purple-600">{gameData?.profile?.streakCount || 0}</div>
                    <div className="text-xs text-gray-600 font-medium">Streak</div>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              {(currentGoal || gameData?.nextLevelData) && (
                <div className="mt-6 bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-700">
                      Progress to Next Level: {currentGoal ? currentGoal.name : gameData?.nextLevelData?.name}
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {currentGoal ? 
                        `${(currentGoal.totalClicks || 0) % 100} / 100` : 
                        `${gameData?.profile?.totalClicks || 0} / ${gameData?.nextLevelData?.clicksRequired || 100}`
                      }
                    </span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={Math.min(currentGoal ? 
                        ((currentGoal.totalClicks || 0) % 100) :
                        ((gameData?.profile?.totalClicks || 0) / (gameData?.nextLevelData?.clicksRequired || 100)) * 100, 100)} 
                      className="h-3 bg-gray-200/50"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/20 to-blue-400/20 animate-pulse"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </header>



        {/* Active Goal - Enhanced */}
        {currentGoal && (
          <section className="mb-8">
            <Card className="border-white/30 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
              {/* Animated border glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-20 blur-sm animate-pulse"></div>
              <div className="absolute inset-[1px] bg-gradient-to-br from-white/90 to-white/70 rounded-lg"></div>
              
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                      <Target className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                        FOCUS TARGET
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">{currentGoal.name}</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white border-0 animate-pulse">
                    <Zap className="mr-1" size={12} />
                    LOCKED IN
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <p className="font-semibold text-gray-800">{currentGoal.description}</p>
                  
                  <div className="flex items-center justify-between bg-white/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-2xl font-black text-blue-600">{currentGoal?.currentLevel || 1}</div>
                      <div className="text-xs text-gray-600 font-medium">LEVEL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-purple-600">{currentGoal?.totalClicks || 0}</div>
                      <div className="text-xs text-gray-600 font-medium">TOTAL REPS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-600">{goalTodayData?.clicks || 0}</div>
                      <div className="text-xs text-gray-600 font-medium">TODAY</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-700">Weekly Domination</span>
                      <span className="text-sm font-black text-gray-800">
                        {goalTodayData?.clicks || 0} / {currentGoal?.weeklyTarget || 100}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={Math.min(((goalTodayData?.clicks || 0) / (currentGoal?.weeklyTarget || 100)) * 100, 100)} 
                        className="h-3 bg-gray-200/50"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Daily Challenge - Beast Mode */}
        {dailyChallenge && (
          <section className="mb-8">
            <Card className="border-white/30 bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-red-500/10 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
              {/* Fire animation effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 opacity-20 blur-sm animate-pulse"></div>
              <div className="absolute inset-[1px] bg-gradient-to-br from-white/90 to-white/70 rounded-lg"></div>
              
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300 animate-pulse">
                      <Zap className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                        DAILY BEAST MODE
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">24hr Challenge Window</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 animate-bounce">
                    <Target className="mr-1" size={12} />
                    HUNT
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border-l-4 border-orange-500">
                    <p className="font-bold text-gray-800 text-lg">{dailyChallenge.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-orange-700">Victory Reward</span>
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {dailyChallenge.reward}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                      onClick={() => {/* Handle challenge acceptance */}}
                    >
                      CRUSH IT NOW
                    </Button>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium">Time Left</div>
                      <div className="text-sm font-bold text-orange-600">23:47:12</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

      {/* Click Section */}
      <section className="text-center mb-8">
        <Card className="border-gray-100 shadow-lg">
          <CardContent className="pt-8 pb-12 md:pt-12 md:pb-16">
            {/* Click Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
              {/* Decrease Button */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleDecrement}
                  disabled={decrementMutation.isPending || (todayData?.clicks || 0) <= 0}
                  className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-500/30 relative overflow-hidden touch-manipulation ${
                    isAnimating ? 'scale-95' : ''
                  } ${decrementMutation.isPending || (todayData?.clicks || 0) <= 0 ? 'opacity-30' : ''}`}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                  <Minus className="relative z-10" size={24} />
                </Button>
                <span className="text-xs text-text-secondary font-medium">Remove {currentGoal ? currentGoal.name : 'Shot'}</span>
              </div>

              {/* Main Click Button */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Button
                    onClick={handleIncrement}
                    onKeyDown={handleKeyDown}
                    disabled={incrementMutation.isPending}
                    className={`w-36 h-36 md:w-44 md:h-44 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 focus:outline-none relative overflow-hidden touch-manipulation ${
                      isAnimating ? 'scale-95' : ''
                    } ${incrementMutation.isPending ? 'opacity-50' : ''}`}
                    style={{ 
                      background: `linear-gradient(135deg, ${gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#1976D2'}, ${gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#1565C0'}DD)`,
                      boxShadow: `0 20px 40px ${gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#1976D2'}30, 0 0 30px ${gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#1976D2'}20`,
                      transition: 'all 0.3s ease-in-out',
                      border: `3px solid ${gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#1976D2'}80`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-full"></div>
                    <MousePointer className="relative z-10 drop-shadow-lg" size={52} />
                  </Button>
                  {isAnimating && (
                    <div 
                      className="absolute inset-0 border-4 rounded-full animate-ping opacity-75"
                      style={{ borderColor: gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#1976D2' }}
                    ></div>
                  )}
                </div>
                <span className="text-sm text-text-secondary font-medium">{currentGoal ? `Work on ${currentGoal.name}` : 'Shoot the Ball'}</span>
              </div>

              {/* Increase Button */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleIncrement}
                  disabled={incrementMutation.isPending}
                  className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/30 relative overflow-hidden touch-manipulation ${
                    isAnimating ? 'scale-95' : ''
                  } ${incrementMutation.isPending ? 'opacity-50' : ''}`}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                  <Plus className="relative z-10" size={24} />
                </Button>
                <span className="text-xs text-text-secondary font-medium">Add {currentGoal ? currentGoal.name : 'Shot'}</span>
              </div>
            </div>

            {/* Today's Count */}
            <div className="mb-4">
              <h2 className="text-text-secondary text-lg font-medium mb-2">
                {currentGoal ? `Today's ${currentGoal.name}` : "Today's Shots"}
              </h2>
              <div className="text-5xl md:text-6xl font-bold text-text-primary">
                {goalTodayData?.clicks || 0}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* Current Streak */}
              <div className="inline-flex items-center bg-success/10 text-success px-4 py-2 rounded-full">
                <Flame className="mr-2" size={16} />
                <span className="font-medium">
                  {gameData?.profile?.streakCount || 0} day streak
                </span>
              </div>

              {/* Total Score */}
              <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Star className="mr-2" size={16} />
                <span className="font-medium">
                  {currentGoal ? `${currentGoal.totalClicks || 0} total ${currentGoal.name}` : `${gameData?.profile?.totalClicks || 0} career shots`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Game Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Weekly Practice */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Weekly Practice</h3>
              <div className="bg-blue-100 p-2 rounded-lg">
                <CalendarDays className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-blue-900">
                {weeklyData?.totalClicks || 0}
              </div>
              <div className="text-sm text-blue-700">
                Shots this week
              </div>
              <div className="flex items-center text-sm">
                <span className="text-blue-600 mr-2">Daily average:</span>
                <span className="font-medium text-blue-900">
                  {weeklyData?.averageClicks || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Training */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900">Monthly Training</h3>
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="text-green-600" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-green-900">
                {monthlyData?.totalClicks || 0}
              </div>
              <div className="text-sm text-green-700">
                Shots this month
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-600 mr-2">Daily average:</span>
                <span className="font-medium text-green-900">
                  {monthlyData?.averageClicks || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Stats */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-900">Career Stats</h3>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Trophy className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-purple-900">
                {allTimeData?.totalClicks || 0}
              </div>
              <div className="text-sm text-purple-700">
                Total career shots
              </div>
              <div className="flex items-center text-sm">
                <span className="text-purple-600 mr-2">Best day:</span>
                <span className="font-medium text-purple-900">
                  {allTimeData?.bestDay || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Goals */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Training Focus</h3>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Target className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium text-blue-900">
                🏀 Free Throw Shooting
              </div>
              <div className="text-xs text-blue-700">
                Level {gameData?.profile?.currentLevel || 1} • Weekly target: 5 shots
              </div>
              <Progress 
                value={Math.min(((todayData?.clicks || 0) / 5) * 100, 100)} 
                className="h-2"
              />
              <div className="flex gap-2">
                <Link href="/goals" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Switch
                  </Button>
                </Link>
                <Link href="/goals" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Progress
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-amber-900">Achievements</h3>
              <div className="bg-amber-100 p-2 rounded-lg">
                <Award className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-amber-900">
                {gameData?.achievements?.filter(a => a.unlocked).length || 0}
              </div>
              <div className="text-sm text-amber-700">
                Achievements unlocked
              </div>
              <div className="flex items-center text-sm">
                <span className="text-amber-600 mr-2">Available:</span>
                <span className="font-medium text-amber-900">
                  {gameData?.achievements?.length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skins & Achievements Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Unlocked Skins */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shirt className="mr-2" size={20} />
              Unlocked Uniforms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {gameData?.availableSkins?.filter(skin => skin.unlocked).map((skin) => (
                <div 
                  key={skin.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    skin.id === gameData.profile.currentSkin 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: `${skin.color}15` }}
                >
                  <div 
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: skin.color }}
                  ></div>
                  <p className="text-xs text-center font-medium">{skin.name}</p>
                  <p className="text-xs text-center text-text-secondary">{skin.description}</p>
                </div>
              )) || []}
            </div>
            {(!gameData?.availableSkins?.some(s => s.unlocked) || gameData.availableSkins.filter(s => s.unlocked).length === 0) && (
              <p className="text-center text-text-secondary">Keep playing to unlock new uniforms!</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2" size={20} />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gameData?.achievements?.filter(achievement => achievement.unlocked).slice(0, 6).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="font-medium text-green-900">{achievement.name}</p>
                    <p className="text-sm text-green-700">{achievement.description}</p>
                  </div>
                </div>
              )) || []}
              {(!gameData?.achievements?.some(a => a.unlocked) || gameData.achievements.filter(a => a.unlocked).length === 0) && (
                <p className="text-center text-text-secondary">Start playing to unlock achievements!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity */}
      <section>
        <Card className="border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Last 7 Days {currentGoal && !showAllGoalsData ? `- ${currentGoal.name}` : ''}
              </h3>
              <div className="flex items-center gap-2">
                {currentGoal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllGoalsData(!showAllGoalsData)}
                    className="text-xs"
                  >
                    {showAllGoalsData ? `Show ${currentGoal.name}` : 'Show All Goals'}
                  </Button>
                )}
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BarChart3 className="text-primary" size={20} />
                </div>
              </div>
            </div>
            
            {(showAllGoalsData ? last7DaysData : (goalLast7DaysData || last7DaysData)) && (
              <div className="space-y-3">
                {(showAllGoalsData ? last7DaysData : (goalLast7DaysData || last7DaysData)).map((day, index) => {
                  const dataToUse = showAllGoalsData ? last7DaysData : (goalLast7DaysData || last7DaysData);
                  const maxClicks = Math.max(...(dataToUse?.map(d => d.clicks) || [0]), 1);
                  const percentage = maxClicks > 0 ? (day.clicks / maxClicks) * 100 : 0;
                  
                  return (
                    <div key={day.date} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ 
                            backgroundColor: `hsl(var(--primary))`,
                            opacity: day.isToday ? 1 : 0.3 + (index * 0.1)
                          }}
                        ></div>
                        <span className="font-medium text-text-primary">
                          {day.isToday ? 'Today' : day.dayName}
                        </span>
                        <span className="text-sm text-text-secondary">{day.shortDate}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: `hsl(var(--primary))`,
                              opacity: day.isToday ? 1 : 0.3 + (index * 0.1)
                            }}
                          ></div>
                        </div>
                        <span className="font-semibold text-text-primary w-12 text-right">
                          {day.clicks}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

        {/* Footer */}
        <footer className="text-center mt-8 text-text-secondary text-sm">
          <p>Your basketball journey is automatically saved • Keep training to unlock more rewards!</p>
        </footer>
      </div>
    </div>
  );
}
