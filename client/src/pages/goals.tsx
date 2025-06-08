import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Target, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Flame,
  Home,
  Users,
  ChevronRight,
  Activity,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

interface Goal {
  id: number;
  name: string;
  description: string;
  category: string;
  maxLevel: number;
}

interface PlayerGoal {
  id: number;
  goalId: number;
  currentLevel: number;
  totalClicks: number;
  levelPoints: number;
  weeklyTarget: number;
  lastActivityDate: string | null;
  goal: Goal;
  category: any;
  decayInfo?: {
    daysInactive: number;
    pointsLost: number;
  };
  progressMessage?: string;
}

interface GoalStats {
  goal: Goal;
  playerGoal: PlayerGoal;
  weeklyStats: {
    clicks: number;
    target: number;
    progressPercentage: number;
    metTarget: boolean;
  };
  dailyData: Array<{
    date: string;
    clicks: number;
    dayName: string;
    isToday: boolean;
  }>;
}

export default function Goals() {
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: playerGoals } = useQuery<PlayerGoal[]>({
    queryKey: ["/api/player/goals"],
  });

  const { data: goalStats } = useQuery<GoalStats>({
    queryKey: ["/api/goals", selectedGoalId, "stats"],
    enabled: !!selectedGoalId,
  });

  const clickMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const response = await fetch(`/api/goals/${goalId}/click`, { method: "POST" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/goals"] });
      if (selectedGoalId) {
        queryClient.invalidateQueries({ queryKey: ["/api/goals", selectedGoalId, "stats"] });
      }
    },
  });

  const switchGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const response = await fetch("/api/player/active-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId }),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/goals"] });
    },
  });

  const selectedGoal = playerGoals?.find(pg => pg.goalId === selectedGoalId);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "shooting": return "🏀";
      case "fundamentals": return "⚡";
      case "defense": return "🛡️";
      case "fitness": return "💪";
      default: return "🎯";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "shooting": return "bg-amber-100 text-amber-800 border-amber-200";
      case "fundamentals": return "bg-blue-100 text-blue-800 border-blue-200";
      case "defense": return "bg-red-100 text-red-800 border-red-200";
      case "fitness": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      {/* Navigation */}
      <nav className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="mr-2" size={16} />
              Training
            </Button>
          </Link>
          <Link href="/social">
            <Button variant="outline" size="sm">
              <Users className="mr-2" size={16} />
              Social
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          <Target className="inline mr-3 text-primary" size={32} />
          Training Goals
        </h1>
        <p className="text-text-secondary">
          Master different basketball skills and track your progress across multiple training areas
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2" size={20} />
                Your Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {playerGoals?.map((playerGoal) => (
                  <div
                    key={playerGoal.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGoalId === playerGoal.goalId
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedGoalId(playerGoal.goalId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getCategoryIcon(playerGoal.goal?.category || "")}
                        </span>
                        <div>
                          <h3 className="font-medium text-sm">{playerGoal.goal?.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(playerGoal.goal?.category || "")}`}
                          >
                            Level {playerGoal.currentLevel}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                    
                    {/* Level Decay Warning */}
                    {playerGoal.decayInfo && playerGoal.decayInfo.pointsLost > 0 && (
                      <div className="flex items-center gap-1 text-orange-600 text-xs mb-2">
                        <AlertTriangle size={12} />
                        <span>Lost {playerGoal.decayInfo.pointsLost} points ({playerGoal.decayInfo.daysInactive} days inactive)</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-600">
                      {playerGoal.totalClicks.toLocaleString()} total clicks
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Action Button */}
              {selectedGoalId && (
                <div className="mt-4 space-y-2">
                  <Button
                    onClick={() => clickMutation.mutate(selectedGoalId)}
                    disabled={clickMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Activity className="mr-2" size={16} />
                    {clickMutation.isPending ? "Training..." : "Train Now"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => switchGoalMutation.mutate(selectedGoalId)}
                    disabled={switchGoalMutation.isPending}
                    className="w-full"
                  >
                    Set as Active Goal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goal Details */}
        <div className="lg:col-span-2">
          {selectedGoal ? (
            <div className="space-y-6">
              {/* Goal Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getCategoryIcon(selectedGoal.goal?.category || "")}
                      </span>
                      <div>
                        <h2 className="text-xl">{selectedGoal.goal?.name}</h2>
                        <p className="text-sm text-gray-600">{selectedGoal.goal?.description}</p>
                      </div>
                    </div>
                    <Badge className="text-lg px-3 py-1">
                      Level {selectedGoal.currentLevel}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedGoal.totalClicks.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedGoal.levelPoints || 0}
                      </div>
                      <div className="text-sm text-gray-600">Level Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedGoal.weeklyTarget}
                      </div>
                      <div className="text-sm text-gray-600">Weekly Target</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedGoal.lastActivityDate 
                          ? Math.floor((new Date().getTime() - new Date(selectedGoal.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
                          : "N/A"
                        }
                      </div>
                      <div className="text-sm text-gray-600">Days Since Last</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Progress */}
              {goalStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2" size={20} />
                      Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress to weekly target</span>
                        <span className="text-sm font-medium">
                          {goalStats.weeklyStats.clicks} / {goalStats.weeklyStats.target}
                        </span>
                      </div>
                      
                      <Progress 
                        value={Math.min(goalStats.weeklyStats.progressPercentage, 100)} 
                        className="h-3"
                      />
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className={`flex items-center gap-1 ${
                          goalStats.weeklyStats.metTarget ? "text-green-600" : "text-orange-600"
                        }`}>
                          {goalStats.weeklyStats.metTarget ? (
                            <Trophy size={16} />
                          ) : (
                            <Clock size={16} />
                          )}
                          <span>
                            {goalStats.weeklyStats.metTarget 
                              ? "Target achieved!" 
                              : `${Math.round(goalStats.weeklyStats.progressPercentage)}% complete`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Daily Chart */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">Daily Activity</h4>
                        <div className="flex items-end gap-2 h-24">
                          {goalStats.dailyData.map((day) => (
                            <div key={day.date} className="flex-1 flex flex-col items-center">
                              <div 
                                className={`w-full rounded-t transition-all ${
                                  day.isToday ? "bg-blue-500" : "bg-gray-300"
                                }`}
                                style={{ 
                                  height: `${Math.max((day.clicks / Math.max(...goalStats.dailyData.map(d => d.clicks || 0), 1)) * 100, 4)}%`,
                                  minHeight: (day.clicks || 0) > 0 ? "8px" : "2px"
                                }}
                                title={`${day.dayName}: ${day.clicks} clicks`}
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {day.dayName}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress Messages */}
              {selectedGoal.progressMessage && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Flame className="text-amber-600" size={20} />
                      <span className="font-medium">{selectedGoal.progressMessage}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Target className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Goal</h3>
                  <p className="text-gray-600">Choose a training goal from the left to view details and start training.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}