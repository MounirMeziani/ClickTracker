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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Target, CheckCircle, ArrowRight, Sparkles, Trophy, Users, Clock, Star, Play, Zap, Award, ChevronRight, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const goalSchema = z.object({
  name: z.string().min(3, "Goal name must be at least 3 characters"),
  description: z.string().min(10, "Please provide a description of at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
});

const GOAL_CATEGORIES = [
  { value: "productivity", label: "Productivity", description: "Work tasks, project milestones", icon: Target },
  { value: "learning", label: "Learning", description: "Study sessions, skill development", icon: Star },
  { value: "health", label: "Health & Fitness", description: "Exercise, wellness activities", icon: Zap },
  { value: "creativity", label: "Creative Work", description: "Writing, design, art projects", icon: Sparkles },
  { value: "communication", label: "Communication", description: "Emails, meetings, networking", icon: Users },
  { value: "organization", label: "Organization", description: "Planning, organizing, scheduling", icon: Clock },
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

  const totalSteps = 4;
  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
    },
  });

  const createGoal = useMutation({
    mutationFn: async (goalData: z.infer<typeof goalSchema>) => {
      return await apiRequest("POST", "/api/goals", goalData);
    },
    onSuccess: () => {
      toast({
        title: "Goal Created!",
        description: "Your first goal is ready. Time to start your productivity journey!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setStep(4); // Move to completion step
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof goalSchema>) => {
    createGoal.mutate(values);
  };

  const handleSuggestionSelect = (suggestion: typeof SUGGESTED_GOALS[0]) => {
    setSelectedSuggestion(suggestion);
    form.setValue("name", suggestion.name);
    form.setValue("description", suggestion.description);
    form.setValue("category", suggestion.category);
    setStep(3);
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const finishOnboarding = () => {
    setLocation("/");
  };

  // Step 1: Welcome & Introduction
  const WelcomeStep = () => (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Circle className="w-16 h-16 text-orange-500" />
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          Welcome to Your Productivity Court
        </h1>
        <p className="text-lg text-muted-foreground">
          Transform your daily tasks into an engaging basketball career journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-orange-200">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <CardTitle className="text-lg">Level Up Your Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start as a Rookie and progress through 12 career levels to become a Hall of Famer
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <CardTitle className="text-lg">Team Collaboration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create teams, share progress, and motivate each other to reach your goals
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              <Award className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-lg">Unlock Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Earn achievements, unlock new uniforms, and complete daily challenges
            </p>
          </CardContent>
        </Card>
      </div>

      <Button onClick={nextStep} size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
        Get Started
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );

  // Step 2: How It Works
  const HowItWorksStep = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">How It Works</h2>
        <p className="text-lg text-muted-foreground">
          Your productivity journey simplified in basketball terms
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start space-x-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-lg">Create Your Goal</h3>
            <p className="text-muted-foreground">
              Set up a specific productivity goal that matters to you. Think of it as choosing your position on the team.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            2
          </div>
          <div>
            <h3 className="font-semibold text-lg">Track Your Activity</h3>
            <p className="text-muted-foreground">
              Each completed task or focused session counts as "points scored." Use the main button to track your progress.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
            3
          </div>
          <div>
            <h3 className="font-semibold text-lg">Level Up Your Career</h3>
            <p className="text-muted-foreground">
              As you accumulate points, you'll progress from Rookie to Hall of Famer, unlocking new uniforms and achievements.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            4
          </div>
          <div>
            <h3 className="font-semibold text-lg">Collaborate & Compete</h3>
            <p className="text-muted-foreground">
              Join teams, share progress with teammates, and motivate each other to reach new heights.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-lg border border-orange-200">
        <div className="flex items-center space-x-3 mb-3">
          <Target className="w-6 h-6 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Goal System - The "Swappable CD" Concept</h3>
        </div>
        <p className="text-orange-700">
          You can create multiple goals, but only one can be active at a time - like switching between different training programs. 
          Each goal tracks its own progress independently, so you can switch focus without losing any data.
        </p>
      </div>

      <div className="flex space-x-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} className="flex-1">
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Step 3: Goal Selection
  const GoalSelectionStep = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your First Goal</h2>
        <p className="text-lg text-muted-foreground">
          Select a pre-made goal or create your own custom productivity target
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Quick Start Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUGGESTED_GOALS.map((goal, index) => {
              const category = GOAL_CATEGORIES.find(cat => cat.value === goal.category);
              const IconComponent = category?.icon || Target;
              
              return (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSuggestion?.name === goal.name ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                  }`}
                  onClick={() => handleSuggestionSelect(goal)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
                        <IconComponent className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {category?.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-4">Or Create Custom Goal</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Daily Writing Practice" 
                        {...field}
                        className="bg-white"
                      />
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
                        {...field}
                        className="bg-white"
                      />
                    </FormControl>
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
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GOAL_CATEGORIES.map((category) => {
                          const IconComponent = category.icon;
                          return (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center space-x-2">
                                <IconComponent className="w-4 h-4" />
                                <span>{category.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-4">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={createGoal.isPending}
                >
                  {createGoal.isPending ? "Creating Goal..." : "Create Goal"}
                  <Play className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );

  // Step 4: Completion
  const CompletionStep = () => (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
          Welcome to the Team!
        </h1>
        <p className="text-lg text-muted-foreground">
          Your goal is created and you're ready to start your productivity journey
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <h3 className="font-semibold text-green-800 mb-3">What's Next?</h3>
        <div className="space-y-2 text-sm text-green-700">
          <div className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4" />
            <span>Use the main click button to track your daily progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4" />
            <span>Complete daily challenges to earn extra rewards</span>
          </div>
          <div className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4" />
            <span>Level up from Rookie to Hall of Famer as you progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4" />
            <span>Create teams and collaborate with others</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <Target className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="font-medium">Current Level</p>
          <p className="text-2xl font-bold text-orange-600">Rookie</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="font-medium">Daily Goal</p>
          <p className="text-2xl font-bold text-blue-600">Start Small</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="font-medium">Next Unlock</p>
          <p className="text-2xl font-bold text-purple-600">Level 2</p>
        </div>
      </div>

      <Button 
        onClick={finishOnboarding} 
        size="lg" 
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
      >
        Start Training
        <Play className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Step {step} of {totalSteps}
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {step === 1 && <WelcomeStep />}
          {step === 2 && <HowItWorksStep />}
          {step === 3 && <GoalSelectionStep />}
          {step === 4 && <CompletionStep />}
        </div>
      </div>
    </div>
  );
}