import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Target, CheckCircle, ArrowRight, Sparkles, Trophy, Users, Clock, Star, Play, Zap, Award, ChevronRight, Circle, Rocket, TrendingUp, Calendar, MousePointer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const goalSchema = z.object({
  name: z.string().min(3, "Goal name must be at least 3 characters"),
  description: z.string().min(10, "Please provide a description of at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
});

const GOAL_CATEGORIES = [
  { value: "productivity", label: "Productivity", description: "Work tasks, project milestones", icon: Target, color: "bg-orange-500" },
  { value: "learning", label: "Learning", description: "Study sessions, skill development", icon: Star, color: "bg-blue-500" },
  { value: "health", label: "Health & Fitness", description: "Exercise, wellness activities", icon: Zap, color: "bg-green-500" },
  { value: "creativity", label: "Creative Work", description: "Writing, design, art projects", icon: Sparkles, color: "bg-purple-500" },
  { value: "communication", label: "Communication", description: "Emails, meetings, networking", icon: Users, color: "bg-indigo-500" },
  { value: "organization", label: "Organization", description: "Planning, organizing, scheduling", icon: Clock, color: "bg-pink-500" },
];

const SUGGESTED_GOALS = [
  { name: "Deep Work Sessions", description: "Track focused work periods without distractions", category: "productivity" },
  { name: "Daily Learning", description: "Study new skills or educational content for 30 minutes", category: "learning" },
  { name: "Email Processing", description: "Manage inbox and respond to important emails efficiently", category: "communication" },
  { name: "Project Milestones", description: "Complete specific tasks toward your main project", category: "productivity" },
  { name: "Creative Writing", description: "Daily writing or content creation sessions", category: "creativity" },
  { name: "Exercise Sessions", description: "Track workout or physical activity progress", category: "health" },
  { name: "Weekly Planning", description: "Organize schedule and priorities for the week", category: "organization" },
  { name: "Skill Practice", description: "Practice a specific skill you want to improve", category: "learning" },
];

const BENEFITS = [
  { icon: Trophy, title: "Level Up Like a Pro", description: "Earn points and unlock achievements as you progress" },
  { icon: TrendingUp, title: "Visual Progress Tracking", description: "See your improvement with detailed charts and analytics" },
  { icon: Users, title: "Team Collaboration", description: "Join teams and stay motivated with others" },
  { icon: Target, title: "Smart Goal Setting", description: "Set SMART goals that adapt to your performance" },
];

export default function OnboardingEnhanced() {
  const [step, setStep] = useState(1);
  const [selectedSuggestion, setSelectedSuggestion] = useState<typeof SUGGESTED_GOALS[0] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationClass, setAnimationClass] = useState("");
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const totalSteps = 5;
  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      description: "",
      category: "",
    },
  });

  const createGoal = useMutation({
    mutationFn: async (goalData: z.infer<typeof goalSchema>) => {
      const response = await apiRequest("POST", "/api/goals", goalData);
      const result = await response.json();
      await apiRequest("POST", `/api/goals/${result.id}/activate`, {});
      return result;
    },
    onSuccess: () => {
      setShowConfetti(true);
      setAnimationClass("animate-bounce");
      toast({
        title: "🎉 Goal Created!",
        description: "Your productivity journey begins now!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      setTimeout(() => {
        setStep(5);
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeOnboarding = async () => {
    setIsCompletingOnboarding(true);
    try {
      await apiRequest("POST", "/api/auth/complete-onboarding", {});
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome aboard!",
        description: "Your productivity journey starts now.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompletingOnboarding(false);
    }
  };

  const onSubmit = (values: z.infer<typeof goalSchema>) => {
    createGoal.mutate(values);
  };

  const handleSuggestionSelect = (suggestion: typeof SUGGESTED_GOALS[0]) => {
    setSelectedSuggestion(suggestion);
    setAnimationClass("animate-pulse");
    setTimeout(() => {
      createGoal.mutate(suggestion);
    }, 500);
  };

  const nextStep = () => {
    setAnimationClass("animate-slideInRight");
    setTimeout(() => {
      setStep(step + 1);
      setAnimationClass("");
    }, 300);
  };

  const userName = (user as any)?.firstName || (user as any)?.email?.split('@')[0] || "Champion";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-12 h-12 bg-orange-300 rounded-full opacity-30 animate-bounce"></div>
      </div>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 ${['bg-orange-400', 'bg-blue-400', 'bg-purple-400', 'bg-yellow-400'][i % 4]} 
                         animate-ping opacity-75`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className={`w-12 h-12 bg-gradient-to-br from-orange-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ${animationClass}`}>
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                Welcome to Focus
              </h1>
              <p className="text-gray-600 text-sm">Your productivity journey starts here</p>
            </div>
          </div>
          <div className="max-w-md mx-auto">
            <Progress value={progressPercentage} className="h-3 mb-2" />
            <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
          </div>
        </div>

        {/* Step 1: Welcome & Value Proposition */}
        {step === 1 && (
          <Card className="border-2 border-orange-100 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                Hey {userName}! Ready to level up your productivity?
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Focus uses basketball-inspired gamification to make achieving your goals fun and engaging.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center pt-4">
                <Button onClick={nextStep} size="lg" className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white px-8">
                  Let's Get Started <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Goal Categories Overview */}
        {step === 2 && (
          <Card className="border-2 border-blue-100 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">Choose Your Focus Area</CardTitle>
              <CardDescription className="text-lg">
                What area of your life do you want to improve first?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {GOAL_CATEGORIES.map((category) => (
                  <div 
                    key={category.value}
                    className="p-4 border-2 border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer group"
                    onClick={() => {
                      form.setValue("category", category.value);
                      nextStep();
                    }}
                  >
                    <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-center text-gray-800">{category.label}</h3>
                    <p className="text-sm text-gray-600 text-center mt-1">{category.description}</p>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Button variant="outline" onClick={nextStep}>
                  I'll choose later <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Quick Start with Suggestions */}
        {step === 3 && (
          <Card className="border-2 border-purple-100 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">Quick Start Goals</CardTitle>
              <CardDescription className="text-lg">
                Choose a pre-made goal to get started instantly, or create your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {SUGGESTED_GOALS.slice(0, 6).map((suggestion, index) => (
                  <div 
                    key={index}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      selectedSuggestion?.name === suggestion.name 
                        ? 'border-orange-400 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-200'
                    }`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">{suggestion.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {GOAL_CATEGORIES.find(c => c.value === suggestion.category)?.label}
                        </Badge>
                      </div>
                      <Play className="w-5 h-5 text-orange-500 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="text-center">
                <Button variant="outline" onClick={nextStep} className="border-2">
                  Create Custom Goal <Target className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Custom Goal Creation */}
        {step === 4 && (
          <Card className="border-2 border-green-100 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">Create Your Custom Goal</CardTitle>
              <CardDescription>
                Design a goal that perfectly fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Goal Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Complete daily writing" {...field} className="h-12 text-lg" />
                        </FormControl>
                        <FormDescription>
                          Choose a clear, specific name for your goal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what you want to achieve and why it's important to you..."
                            className="min-h-[100px] text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain what success looks like for this goal
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
                        <FormLabel className="text-lg font-semibold">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-lg">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GOAL_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center space-x-2">
                                  <category.icon className="w-4 h-4" />
                                  <span>{category.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1">
                      Back to Suggestions
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createGoal.isPending}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white"
                    >
                      {createGoal.isPending ? "Creating..." : "Create Goal"}
                      <Target className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Success & Next Steps */}
        {step === 5 && (
          <Card className="border-2 border-green-200 shadow-xl bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Congratulations, {userName}!
              </CardTitle>
              <CardDescription className="text-xl text-gray-700">
                Your goal is ready. You're about to join thousands of users achieving their dreams.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Here's what happens next:</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <MousePointer className="w-4 h-4 text-white" />
                    </div>
                    <span>Click to track your progress and earn points</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span>Watch your level increase as you build consistency</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <span>Unlock achievements and new basketball uniforms</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span>Join teams and compete with friends</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center pt-4">
                <Button 
                  onClick={completeOnboarding} 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 text-lg"
                  disabled={isCompletingOnboarding}
                >
                  {isCompletingOnboarding ? "Setting up..." : "Start My Productivity Journey 🚀"}
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Ready to make today count? Your first click is just a tap away.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}