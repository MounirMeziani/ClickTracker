import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { MousePointer, CalendarDays, Calendar, Trophy, BarChart3, Flame, Plus, Minus } from "lucide-react";
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

  const incrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/clicks/increment"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/last-7-days"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record click. Please try again.",
        variant: "destructive",
      });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/clicks/decrement"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/last-7-days"] });
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <header className="text-center mb-8">
        <Card className="border-gray-100">
          <CardContent className="pt-6">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              <MousePointer className="inline mr-3 text-primary" size={32} />
              Click Counter
            </h1>
            <div className="text-text-secondary">
              <p className="text-lg font-medium">
                {formatDate(currentDate)}
              </p>
              <p className="text-sm mt-1">
                Day {getDayOfYear(currentDate)} of {currentDate.getFullYear()}
              </p>
            </div>
          </CardContent>
        </Card>
      </header>

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
                    className={`w-36 h-36 md:w-44 md:h-44 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/30 relative overflow-hidden touch-manipulation ${
                      isAnimating ? 'scale-95' : ''
                    } ${incrementMutation.isPending ? 'opacity-50' : ''}`}
                    style={{ 
                      background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(207 90% 45%))',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                    <MousePointer className="relative z-10" size={52} />
                  </Button>
                  {isAnimating && (
                    <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-75"></div>
                  )}
                </div>
                <span className="text-sm text-text-secondary font-medium">Tap to Count</span>
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
              <h2 className="text-text-secondary text-lg font-medium mb-2">Today's Clicks</h2>
              <div className="text-5xl md:text-6xl font-bold text-text-primary">
                {todayData?.clicks || 0}
              </div>
            </div>

            {/* Current Streak */}
            <div className="inline-flex items-center bg-success/10 text-success px-4 py-2 rounded-full">
              <Flame className="mr-2" size={16} />
              <span className="font-medium">
                {calculateStreak()} day streak
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Stats Card */}
        <Card className="border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">This Week</h3>
              <div className="bg-primary/10 p-2 rounded-lg">
                <CalendarDays className="text-primary" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-text-primary">
                {weeklyData?.totalClicks || 0}
              </div>
              <div className="text-sm text-text-secondary">
                Total clicks this week
              </div>
              <div className="flex items-center text-sm">
                <span className="text-text-secondary mr-2">Daily average:</span>
                <span className="font-medium text-text-primary">
                  {weeklyData?.averageClicks || 0}
                </span>
              </div>
              <Progress 
                value={weeklyData ? Math.min((weeklyData.totalClicks / 1000) * 100, 100) : 0} 
                className="mt-3" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats Card */}
        <Card className="border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">This Month</h3>
              <div className="bg-secondary/10 p-2 rounded-lg">
                <Calendar className="text-secondary" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-text-primary">
                {monthlyData?.totalClicks || 0}
              </div>
              <div className="text-sm text-text-secondary">
                Total clicks this month
              </div>
              <div className="flex items-center text-sm">
                <span className="text-text-secondary mr-2">Daily average:</span>
                <span className="font-medium text-text-primary">
                  {monthlyData?.averageClicks || 0}
                </span>
              </div>
              <Progress 
                value={monthlyData ? Math.min((monthlyData.totalClicks / 5000) * 100, 100) : 0} 
                className="mt-3" 
              />
            </div>
          </CardContent>
        </Card>

        {/* All Time Stats Card */}
        <Card className="border-gray-100 md:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">All Time</h3>
              <div className="bg-success/10 p-2 rounded-lg">
                <Trophy className="text-success" size={20} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-text-primary">
                {allTimeData?.totalClicks || 0}
              </div>
              <div className="text-sm text-text-secondary">
                Total clicks recorded
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">
                    {allTimeData?.bestDay || 0}
                  </div>
                  <div className="text-xs text-text-secondary">Best Day</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-text-primary">
                    {allTimeData?.daysActive || 0}
                  </div>
                  <div className="text-xs text-text-secondary">Days Active</div>
                </div>
              </div>
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
        <p>Data automatically synced and stored securely</p>
      </footer>
    </div>
  );
}
