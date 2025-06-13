import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Users, Trophy, TrendingUp, Zap, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
              Focus
            </span>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4 border-orange-200 text-orange-700 bg-orange-50">
            Basketball-Inspired Productivity
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Turn Your Goals Into Game-Winning Shots
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your progress like a basketball pro. Set goals, build streaks, and level up your productivity with gamified tracking and team collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white px-8 py-3"
            >
              Start Your Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-blue-200 hover:bg-blue-50"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Why Choose Focus?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Combining the excitement of basketball with proven productivity techniques to help you achieve your goals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 border-orange-100 hover:border-orange-200 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Goal Setting</h3>
              <p className="text-gray-600">
                Set SMART goals and track your progress with basketball-inspired levels and achievements.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Team Collaboration</h3>
              <p className="text-gray-600">
                Join teams, compete with friends, and stay motivated through social accountability.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Gamification</h3>
              <p className="text-gray-600">
                Earn points, unlock achievements, and level up as you consistently work towards your goals.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white/60 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Track Progress Like a Pro
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mt-1">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Daily Click Tracking</h4>
                    <p className="text-gray-600">Track your focus sessions and build consistent habits</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mt-1">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Progress Analytics</h4>
                    <p className="text-gray-600">Visualize your improvement with detailed charts and stats</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mt-1">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Secure & Private</h4>
                    <p className="text-gray-600">Your data is protected with enterprise-level security</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-blue-100 rounded-2xl p-8 text-center">
              <div className="text-4xl font-bold text-gray-800 mb-2">10,000+</div>
              <p className="text-gray-600 mb-4">Goals achieved by our users</p>
              <div className="text-4xl font-bold text-gray-800 mb-2">500+</div>
              <p className="text-gray-600 mb-4">Active teams collaborating</p>
              <div className="text-4xl font-bold text-gray-800 mb-2">95%</div>
              <p className="text-gray-600">User satisfaction rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Ready to Level Up Your Productivity?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who have transformed their goal achievement with Focus.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white px-8 py-3"
          >
            Get Started Free
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Secure login with Replit
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Focus</span>
          </div>
          <p className="text-gray-400">
            Transform your goals into achievements with basketball-inspired productivity tracking.
          </p>
        </div>
      </footer>
    </div>
  );
}