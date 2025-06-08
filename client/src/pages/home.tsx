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

export default function Home() {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

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
  });

  const { data: activeGoal } = useQuery({
    queryKey: ["/api/goals/active"],
  });

  const { data: goalTodayData } = useQuery({
    queryKey: ["/api/goals/active/today"],
    enabled: !!activeGoal,
  });

  // Use first goal as fallback if no active goal is set
  const currentGoal = activeGoal || (Array.isArray(goals) && goals.length > 0 ? goals[0] : null);

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
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active/today"] });
      
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
      if (activeGoal?.id) {
        console.log("Using goal-specific decrement endpoint for goal ID:", activeGoal.id);
        return fetch(`/api/goals/${activeGoal.id}/decrement`, { method: "POST" }).then(res => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active/today"] });
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Navigation */}
      <nav className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-text-primary">Job Application Tracker</h1>
        <div className="flex gap-2">
          <Link href="/goals">
            <Button variant="outline" className="flex items-center gap-2">
              <Target size={16} />
              Goals
            </Button>
          </Link>
          <Link href="/social">
            <Button variant="outline" className="flex items-center gap-2">
              <Users size={16} />
              Community
            </Button>
          </Link>
          <Link href="/teams">
            <Button variant="outline" className="flex items-center gap-2">
              <Users size={16} />
              Teams
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="text-center mb-8">
        <Card className="border-gray-100 bg-gradient-to-r from-orange-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mr-4 shadow-lg border-4 border-white transition-all duration-500 hover:scale-105"
                style={{ 
                  backgroundColor: gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#6B7280',
                  boxShadow: `0 0 20px ${gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#6B7280'}40`
                }}
              >
                <Crown className="text-white drop-shadow-lg" size={36} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                  {currentGoal ? `Varsity ${currentGoal.name}` : "Basketball Training"}
                </h1>
                <p className="text-lg text-text-secondary">
                  {currentGoal ? `${currentGoal.name} Level • Level ${currentGoal.currentLevel || 1}` : `${gameData?.levelData?.name || "Rookie"} • Level ${gameData?.profile?.currentLevel || 1}`}
                </p>
                <div className="flex items-center mt-1">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 border border-white"
                    style={{ backgroundColor: gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.color || '#6B7280' }}
                  ></div>
                  <span className="text-sm text-text-secondary">
                    {gameData?.availableSkins?.find(s => s.id === gameData.profile.currentSkin)?.name || "Rookie Uniform"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-text-secondary">
              <p className="text-sm">
                {gameData?.levelData?.description || "Just starting your basketball journey"}
              </p>
              {gameData?.nextLevelData && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress: {currentGoal ? currentGoal.name : gameData.nextLevelData.name}</span>
                    <span>{currentGoal ? currentGoal.totalClicks || 0 : gameData.profile.totalClicks} / {gameData.nextLevelData.clicksRequired}</span>
                  </div>
                  <Progress 
                    value={Math.min(((currentGoal ? currentGoal.totalClicks || 0 : gameData.profile.totalClicks) / gameData.nextLevelData.clicksRequired) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </header>



      {/* Active Goal */}
      {currentGoal && (
        <section className="mb-8">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-blue-800">
                <Target className="mr-2" size={20} />
                Active Focus: {currentGoal.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">{currentGoal.description}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Level {currentGoal?.currentLevel || 1} • {currentGoal?.totalClicks || 0} clicks
                  </p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Weekly Target Progress</span>
                      <span>{goalTodayData?.clicks || 0} / {currentGoal?.weeklyTarget || 100}</span>
                    </div>
                    <Progress 
                      value={Math.min(((goalTodayData?.clicks || 0) / (currentGoal?.weeklyTarget || 100)) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Zap className="mr-1" size={12} />
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Daily Challenge */}
      {dailyChallenge && (
        <section className="mb-8">
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-amber-800">
                <Target className="mr-2" size={20} />
                Daily Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-amber-900">{dailyChallenge.description}</p>
                  <p className="text-sm text-amber-700 mt-1">Reward: {dailyChallenge.reward}</p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <Zap className="mr-1" size={12} />
                  Active
                </Badge>
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
                <span className="text-xs text-text-secondary font-medium">Remove</span>
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
                <span className="text-sm text-text-secondary font-medium">Shoot the Ball</span>
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
                <span className="text-xs text-text-secondary font-medium">Add</span>
              </div>
            </div>

            {/* Today's Count */}
            <div className="mb-4">
              <h2 className="text-text-secondary text-lg font-medium mb-2">Today's Shots</h2>
              <div className="text-5xl md:text-6xl font-bold text-text-primary">
                {todayData?.clicks || 0}
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
                  {gameData?.profile?.totalClicks || 0} career shots
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
              <h3 className="text-xl font-semibold text-text-primary">Last 7 Days</h3>
              <div className="bg-primary/10 p-2 rounded-lg">
                <BarChart3 className="text-primary" size={20} />
              </div>
            </div>
            
            {last7DaysData && (
              <div className="space-y-3">
                {last7DaysData.map((day, index) => {
                  const maxClicks = getMaxClicks();
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
  );
}
