import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, Users, TrendingUp, Star, Zap, Award, Crown, MousePointer, Calendar, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: Target,
    title: "No-BS Goal Setting",
    description: "Forget fluffy goal-setting advice. This system forces you to define exactly what winning looks like and tracks every move toward it.",
    color: "bg-orange-500"
  },
  {
    icon: Trophy,
    title: "Championship Mindset",
    description: "Elite athletes don't rely on feelings—they rely on systems. Your progress becomes as addictive as your favorite game.",
    color: "bg-blue-500"
  },
  {
    icon: TrendingUp,
    title: "Raw Data That Matters",
    description: "No sugar-coating. See exactly where you're winning, where you're failing, and what needs to change—immediately.",
    color: "bg-green-500"
  },
  {
    icon: Users,
    title: "Accountability That Bites",
    description: "Your team sees your progress. No hiding, no excuses. When everyone's watching, mediocrity becomes impossible.",
    color: "bg-purple-500"
  },
  {
    icon: Star,
    title: "Earn Your Stripes",
    description: "Every achievement is earned through sweat, not participation trophies. Your badges represent real accomplishment.",
    color: "bg-yellow-500"
  },
  {
    icon: Zap,
    title: "Daily Domination",
    description: "Champions are made in the daily grind. These challenges separate the committed from the comfortable.",
    color: "bg-pink-500"
  }
];

const STATS = [
  { number: "10,000+", label: "Dreams Crushed" },
  { number: "5,000+", label: "Champions Created" },
  { number: "98%", label: "Winners Who Stay" },
  { number: "24/7", label: "Relentless Tracking" }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-blue-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
              Focus
            </h1>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">
            Stop Making Excuses. Start Making Progress.
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Listen, champions don't wait for motivation—they create systems that make success inevitable. 
            This isn't another productivity app. This is your personal training ground where every click 
            builds the habit that separates winners from wannabes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white px-8 py-4 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Join The Elite
              <Crown className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg"
            >
              See It In Action
              <MousePointer className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-800">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              This Isn't For Everyone
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              If you're looking for another feel-good app that tells you what you want to hear, keep scrolling. 
              This is for people who are tired of their own excuses and ready to build something real.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              The System That Separates Winners From Losers
            </h3>
            <p className="text-xl text-gray-600">
              Three steps. No fluff. Real results or you're doing it wrong.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-4">Define Your Victory</h4>
              <p className="text-gray-600">
                Stop being vague. Pick exactly what winning looks like—no room for interpretation or excuses.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-4">Execute Relentlessly</h4>
              <p className="text-gray-600">
                Every click is a rep. Every rep builds the machine. Watch your progress compound daily—no shortcuts, no participation trophies.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-4">Dominate Your Field</h4>
              <p className="text-gray-600">
                Earn achievements through blood, sweat, and consistency. Unlock rewards that mean something—because you actually earned them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Productivity?
          </h3>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of users who are achieving their goals with basketball-inspired motivation.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started Free
            <Award className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-orange-200 mt-4">
            No credit card required. Start achieving your goals in under 2 minutes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Focus</span>
          </div>
          <p className="text-gray-400 mb-4">
            Turn your goals into game-winning shots.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>© 2025 Focus. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}