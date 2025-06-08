import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const goalSchema = z.object({
  name: z.string().min(3, "Goal name must be at least 3 characters"),
  description: z.string().min(10, "Please provide a description of at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
});

const GOAL_CATEGORIES = [
  { value: "productivity", label: "Productivity", description: "Work tasks, project milestones" },
  { value: "learning", label: "Learning", description: "Study sessions, skill development" },
  { value: "health", label: "Health & Fitness", description: "Exercise, wellness activities" },
  { value: "creativity", label: "Creative Work", description: "Writing, design, art projects" },
  { value: "communication", label: "Communication", description: "Emails, meetings, networking" },
  { value: "organization", label: "Organization", description: "Planning, organizing, scheduling" },
];

const SUGGESTED_GOALS = [
  { name: "Deep Work Sessions", description: "Track focused work periods without distractions", category: "productivity" },
  { name: "Email Processing", description: "Manage inbox and respond to important emails", category: "communication" },
  { name: "Learning Progress", description: "Study new skills or educational content", category: "learning" },
  { name: "Project Tasks", description: "Complete specific project milestones", category: "productivity" },
  { name: "Creative Writing", description: "Daily writing or content creation", category: "creativity" },
  { name: "Exercise Sessions", description: "Track workout or physical activity", category: "health" },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedSuggestion, setSelectedSuggestion] = useState<typeof SUGGESTED_GOALS[0] | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof goalSchema>) => {
      console.log("Creating first goal:", data);
      return await apiRequest("POST", "/api/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setStep(3);
      toast({
        title: "Welcome to Your Journey!",
        description: "Your first goal has been created. Start tracking your progress!",
      });
    },
    onError: (error) => {
      console.error("Goal creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSuggestionSelect = (suggestion: typeof SUGGESTED_GOALS[0]) => {
    setSelectedSuggestion(suggestion);
    form.setValue("name", suggestion.name);
    form.setValue("description", suggestion.description);
    form.setValue("category", suggestion.category);
    setStep(2);
  };

  const handleCustomGoal = () => {
    setSelectedSuggestion(null);
    form.reset();
    setStep(2);
  };

  const handleSubmit = async (data: z.infer<typeof goalSchema>) => {
    createGoalMutation.mutate(data);
  };

  const handleCompleteOnboarding = () => {
    setLocation("/");
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <Target className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <CardTitle className="text-2xl">Welcome to Your Productivity Journey!</CardTitle>
            <CardDescription className="text-lg">
              Let's start by setting up your first goal. Choose from our suggestions or create your own.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Suggested Goals</h3>
              <div className="grid gap-3">
                {SUGGESTED_GOALS.map((goal, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionSelect(goal)}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{goal.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      </div>
                      <Badge variant="secondary" className="ml-3">
                        {GOAL_CATEGORIES.find(c => c.value === goal.category)?.label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 mb-4">Or create your own custom goal</p>
              <Button onClick={handleCustomGoal} variant="outline" size="lg">
                Create Custom Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Sparkles className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <CardTitle>Set Up Your Goal</CardTitle>
            <CardDescription>
              {selectedSuggestion ? "Customize your selected goal" : "Create your custom goal"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Deep Work Sessions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what you want to track and achieve..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Explain what this goal means to you and how you'll measure progress
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GOAL_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <div>
                                <div className="font-medium">{category.label}</div>
                                <div className="text-sm text-gray-500">{category.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createGoalMutation.isPending}
                    className="flex-1"
                  >
                    {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <CardTitle className="text-2xl">You're All Set!</CardTitle>
            <CardDescription className="text-lg">
              Your goal has been created and is ready to track. Start clicking to log your progress!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click the counter to track each completed activity</li>
                <li>• Set weekly targets to stay motivated</li>
                <li>• Check your progress in Goals section</li>
                <li>• Create teams to collaborate with others</li>
              </ul>
            </div>
            
            <Button onClick={handleCompleteOnboarding} className="w-full" size="lg">
              Start Tracking Progress
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}