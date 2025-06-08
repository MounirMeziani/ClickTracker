import { useState, useRef, useEffect } from "react";
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
  AlertTriangle,
  Edit2,
  Check,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingGoalId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingGoalId]);

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

  const trainMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const response = await fetch(`/api/goals/${goalId}/click`, { method: "POST" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clicks/all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/profile"] });
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

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, name }: { goalId: number; name: string }) => {
      return await apiRequest("PATCH", `/api/goals/${goalId}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/goals"] });
      setEditingGoalId(null);
      setEditingName("");
      toast({
        title: "Goal Updated",
        description: "Goal name has been updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update goal name. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditingName(goal.name);
  };

  const cancelEditing = () => {
    setEditingGoalId(null);
    setEditingName("");
  };

  const saveGoalName = () => {
    if (editingGoalId && editingName.trim()) {
      updateGoalMutation.mutate({ goalId: editingGoalId, name: editingName.trim() });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveGoalName();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const createGoalMutation = useMutation({
    mutationFn: async ({ name, description, category }: { name: string; description: string; category: string }) => {
      return await apiRequest("POST", "/api/goals", { name, description, category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/goals"] });
      toast({
        title: "Goal Created",
        description: "New goal has been created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create new goal. Please try again.",
        variant: "destructive",
      });
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
                    className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGoalId === playerGoal.goalId
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedGoalId(playerGoal.goalId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">
                          {getCategoryIcon(playerGoal.goal?.category || "")}
                        </span>
                        <div className="flex-1">
                          {editingGoalId === playerGoal.goalId ? (
                            <div className="flex items-center gap-2">
                              <Input
                                ref={inputRef}
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="h-6 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveGoalName();
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Check size={12} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditing();
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">{playerGoal.goal?.name}</h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(playerGoal.goal);
                                }}
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 size={10} />
                              </Button>
                            </div>
                          )}
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
                    onClick={() => selectedGoalId && trainMutation.mutate(selectedGoalId)}
                    disabled={trainMutation.isPending || !selectedGoalId}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Activity className="mr-2" size={16} />
                    {trainMutation.isPending ? "Training..." : "Train Now"}
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
                          {goalStats.weeklyStats?.clicks || 0} / {goalStats.weeklyStats?.target || 0}
                        </span>
                      </div>
                      
                      <Progress 
                        value={Math.min(goalStats.weeklyStats?.progressPercentage || 0, 100)} 
                        className="h-3"
                      />
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className={`flex items-center gap-1 ${
                          goalStats.weeklyStats?.metTarget ? "text-green-600" : "text-orange-600"
                        }`}>
                          {goalStats.weeklyStats?.metTarget ? (
                            <Trophy size={16} />
                          ) : (
                            <Clock size={16} />
                          )}
                          <span>
                            {goalStats.weeklyStats?.metTarget 
                              ? "Target achieved!" 
                              : `${Math.round(goalStats.weeklyStats?.progressPercentage || 0)}% complete`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Daily Chart */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">Daily Activity</h4>
                        <div className="flex items-end gap-2 h-24">
                          {(goalStats.dailyData || []).map((day) => {
                            const clickCount = day?.clicks || 0;
                            const maxClicks = Math.max(...(goalStats.dailyData || []).map(d => d?.clicks || 0), 1);
                            return (
                              <div key={day?.date || Math.random()} className="flex-1 flex flex-col items-center">
                                <div 
                                  className={`w-full rounded-t transition-all ${
                                    day?.isToday ? "bg-blue-500" : "bg-gray-300"
                                  }`}
                                  style={{ 
                                    height: `${Math.max((clickCount / maxClicks) * 100, 4)}%`,
                                    minHeight: clickCount > 0 ? "8px" : "2px"
                                  }}
                                  title={`${day?.dayName || 'Day'}: ${clickCount} clicks`}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                  {day?.dayName || '?'}
                                </div>
                              </div>
                            );
                          })}
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