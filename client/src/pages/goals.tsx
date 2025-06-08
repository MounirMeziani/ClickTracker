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
  X,
  Trash2,
  Plus,
  Play
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
  playerId: number;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  totalClicks: number;
  currentLevel: number;
  levelPoints: number;
  weeklyTarget: number;
  createdAt: string;
  updatedAt: string;
}

export default function Goals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("productivity");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Fetch goals using the clean system
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: activeGoal } = useQuery<Goal>({
    queryKey: ["/api/goals/active"],
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (goalData: any) => apiRequest("POST", "/api/goals", goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      setShowCreateForm(false);
      setNewGoalName("");
      setNewGoalDescription("");
      setNewGoalCategory("productivity");
      toast({
        title: "Goal Created",
        description: "Your new goal has been created successfully!",
      });
    },
    onError: (error) => {
      console.error("Error creating goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, updates }: { goalId: number; updates: any }) =>
      apiRequest("PATCH", `/api/goals/${goalId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      setEditingGoal(null);
      toast({
        title: "Goal Updated",
        description: "Goal has been updated successfully!",
      });
    },
    onError: (error) => {
      console.error("Error updating goal:", error);
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: number) => apiRequest("DELETE", `/api/goals/${goalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      toast({
        title: "Goal Deleted",
        description: "Goal has been deleted successfully!",
      });
    },
    onError: (error) => {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Activate goal mutation
  const activateGoalMutation = useMutation({
    mutationFn: (goalId: number) => apiRequest("POST", `/api/goals/${goalId}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      toast({
        title: "Goal Activated",
        description: "This goal is now your active focus!",
      });
    },
    onError: (error) => {
      console.error("Error activating goal:", error);
      toast({
        title: "Error",
        description: "Failed to activate goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingGoal && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingGoal]);

  const handleStartEdit = (goal: Goal) => {
    setEditingGoal(goal.id);
    setEditName(goal.name);
  };

  const handleSaveEdit = () => {
    if (editingGoal && editName.trim()) {
      updateGoalMutation.mutate({
        goalId: editingGoal,
        updates: { name: editName.trim() }
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setEditName("");
  };

  const handleDeleteGoal = (goalId: number) => {
    if (confirm("Are you sure you want to delete this goal? This action cannot be undone.")) {
      deleteGoalMutation.mutate(goalId);
    }
  };

  const handleCreateGoal = () => {
    if (newGoalName.trim()) {
      createGoalMutation.mutate({
        name: newGoalName.trim(),
        description: newGoalDescription.trim() || "Custom productivity goal",
        category: newGoalCategory,
        weeklyTarget: 100
      });
    }
  };

  const handleActivateGoal = (goalId: number) => {
    activateGoalMutation.mutate(goalId);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      productivity: "bg-blue-100 text-blue-800",
      communication: "bg-green-100 text-green-800", 
      creativity: "bg-purple-100 text-purple-800",
      education: "bg-orange-100 text-orange-800",
      organization: "bg-yellow-100 text-yellow-800",
      learning: "bg-indigo-100 text-indigo-800",
      general: "bg-gray-100 text-gray-800"
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">Loading goals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <nav className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="mr-2" size={16} />
              Home
            </Button>
          </Link>
          <Link href="/teams">
            <Button variant="outline" size="sm">
              <Users className="mr-2" size={16} />
              Teams
            </Button>
          </Link>
          <Link href="/social">
            <Button variant="outline" size="sm">
              <Activity className="mr-2" size={16} />
              Social
            </Button>
          </Link>
        </nav>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-900 mb-2">
            <Target className="inline mr-3" size={40} />
            Training Goals
          </h1>
          <p className="text-orange-700 text-lg">
            Manage your productivity goals and track your progress
          </p>
        </div>

        {/* Active Goal Banner */}
        {activeGoal && (
          <Card className="mb-8 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <Play className="mr-2" size={20} />
                Currently Active: {activeGoal.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700">{activeGoal.description}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    Level {activeGoal.currentLevel} • {activeGoal.totalClicks} total clicks
                  </p>
                </div>
                <Badge className="bg-orange-100 text-orange-800">
                  <Flame className="mr-1" size={12} />
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create New Goal */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Create New Goal</span>
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant="outline"
                size="sm"
              >
                <Plus className="mr-2" size={16} />
                {showCreateForm ? "Cancel" : "Add Goal"}
              </Button>
            </CardTitle>
          </CardHeader>
          {showCreateForm && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Goal Name</label>
                  <Input
                    placeholder="Enter goal name..."
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    placeholder="Describe your goal..."
                    value={newGoalDescription}
                    onChange={(e) => setNewGoalDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                  >
                    <option value="productivity">Productivity</option>
                    <option value="communication">Communication</option>
                    <option value="creativity">Creativity</option>
                    <option value="education">Education</option>
                    <option value="organization">Organization</option>
                    <option value="learning">Learning</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <Button 
                  onClick={handleCreateGoal}
                  disabled={!newGoalName.trim() || createGoalMutation.isPending}
                  className="w-full"
                >
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Goals List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals && goals.length > 0 ? (
            goals.map((goal) => (
              <Card key={goal.id} className={`relative ${goal.isActive ? 'ring-2 ring-orange-300' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingGoal === goal.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={editInputRef}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            className="text-base font-semibold"
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={updateGoalMutation.isPending}
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{goal.name}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(goal)}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardTitle>
                      )}
                      <Badge className={`mt-2 ${getCategoryColor(goal.category)}`}>
                        {goal.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Level {goal.currentLevel}</span>
                      <span>{goal.totalClicks} clicks</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Weekly Target</span>
                      <span>{goal.weeklyTarget}</span>
                    </div>

                    {!goal.isActive && (
                      <Button
                        onClick={() => handleActivateGoal(goal.id)}
                        disabled={activateGoalMutation.isPending}
                        className="w-full mt-4"
                        variant="outline"
                      >
                        <Play className="mr-2" size={16} />
                        Set as Active
                      </Button>
                    )}
                    
                    {goal.isActive && (
                      <div className="flex items-center justify-center mt-4 text-orange-600">
                        <Flame className="mr-2" size={16} />
                        <span className="font-medium">Currently Active</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Target className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Goals Yet</h3>
              <p className="text-gray-500 mb-4">Create your first goal to start tracking your progress!</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2" size={16} />
                Create Your First Goal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}