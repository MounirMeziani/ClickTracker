import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  Calendar,
  Star,
  Flame,
  Crown,
  MessageSquare,
  BarChart3,
  Target
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  profile: {
    id: number;
    currentLevel: number;
    totalClicks: number;
    currentSkin: string;
    streakCount: number;
  };
  rank: number;
}

interface Friend {
  id: number;
  name: string;
  level: number;
  totalShots: number;
  currentStreak: number;
  lastActive: string;
  achievements: number;
  activityLevel: string;
  recentActivity: string;
}

interface FeedItem {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  friend: Friend | null;
}

interface ActivityData {
  activityData: Array<{
    date: string;
    count: number;
    level: number;
  }>;
  weeklyStreak: number;
  totalContributions: number;
  longestStreak: number;
}

export default function Social() {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const { data: teamData } = useQuery<{
    hasTeam: boolean;
    currentPlayer: any;
    team: any;
    teammates: any[];
    leaderboard: LeaderboardEntry[];
  }>({
    queryKey: ["/api/team/info"],
  });

  const { data: teamFeed } = useQuery<FeedItem[]>({
    queryKey: ["/api/team/feed"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: activityData } = useQuery<ActivityData>({
    queryKey: ["/api/team/activity-heatmap"],
  });

  const getActivityColor = (level: number): string => {
    const colors = [
      '#f0f0f0', // 0 - no activity
      '#c6e48b', // 1 - low activity
      '#7bc96f', // 2 - medium activity  
      '#449d44', // 3 - high activity
      '#196127'  // 4 - very high activity
    ];
    return colors[Math.min(level, 4)];
  };

  const renderActivityHeatmap = () => {
    if (!activityData?.activityData) return null;

    const weeks = [];
    const data = activityData.activityData.slice(-365); // Last year
    
    for (let i = 0; i < data.length; i += 7) {
      weeks.push(data.slice(i, i + 7));
    }

    return (
      <div className="flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className="w-3 h-3 rounded-sm border border-gray-200"
                style={{ backgroundColor: getActivityColor(day.level) }}
                title={`${day.date}: ${day.count} shots`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Navigation */}
      <nav className="flex justify-between items-center mb-6">
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            ← Back to Training
          </Button>
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          <Users className="inline mr-3 text-primary" size={32} />
          {teamData?.hasTeam ? `${teamData.team?.name || 'Your Team'}` : 'Team Training'}
        </h1>
        <p className="text-text-secondary">
          {teamData?.hasTeam 
            ? "Train together and track your team's collective progress"
            : "Join a team to connect with fellow basketball players and track progress together"
          }
        </p>
      </header>

      {/* Social Feed with Motivational Messages */}
      <section className="mb-8">
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <MessageSquare className="mr-2" size={20} />
              Training Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamFeed?.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg ${
                    item.type === 'motivational' 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Star className="text-white" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${
                        item.type === 'motivational' ? 'text-purple-800 font-medium' : 'text-gray-700'
                      }`}>
                        {item.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-center text-gray-500">Loading training updates...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Team Leaderboard */}
        <div className="lg:col-span-2">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-900">
                <Trophy className="mr-2" size={20} />
                {teamData?.hasTeam ? 'Team Leaderboard' : 'Join a Team'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamData?.hasTeam ? (
                <div className="space-y-3">
                  {teamData.leaderboard?.map((entry, index) => (
                    <div
                      key={entry.profile.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        index < 3 
                          ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200' 
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-300 text-orange-900' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index === 0 ? <Crown size={16} /> : entry.rank}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            P{entry.profile.id}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">Player {entry.profile.id}</p>
                          <p className="text-sm text-gray-600">Level {entry.profile.currentLevel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{entry.profile.totalClicks.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">shots</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Yet</h3>
                  <p className="text-gray-600 mb-4">Join or create a team to compete with other players and track progress together.</p>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    Find Teams
                  </Button>
                </div>
              )}
              
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold text-sm">
                        YOU
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Your Position</p>
                        <p className="text-sm text-blue-700">Level {teamData.currentPlayer.currentLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-900">
                        {teamData.currentPlayer.totalClicks.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-700">shots</p>
                    </div>
                  </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div>
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-900">
                <Users className="mr-2" size={20} />
                {teamData?.hasTeam ? 'Team Members' : 'Team Features'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamData?.hasTeam ? (
                <div className="space-y-3">
                  {teamData.teammates?.slice(0, 6).map((teammate) => (
                    <div
                      key={teammate.member.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-green-200 hover:bg-green-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            P{teammate.profile.id}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-gray-900">Player {teammate.profile.id}</p>
                          <div className="flex items-center gap-1">
                            <Flame className="text-orange-500" size={12} />
                            <span className="text-xs text-gray-600">{teammate.profile.streakCount} day streak</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs border-green-300 text-green-700"
                      >
                        {teammate.member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 text-sm mb-3">Team features include:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Shared leaderboards</li>
                    <li>• Team activity feed</li>
                    <li>• Collaborative challenges</li>
                    <li>• Progress tracking</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Heatmap */}
      <section className="mb-8">
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2" size={20} />
              Training Activity
              <Badge variant="secondary" className="ml-2">
                {activityData?.totalContributions || 0} shots this year
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-green-600" size={16} />
                    <span className="text-gray-600">Current streak: {activityData?.weeklyStreak || 0} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="text-blue-600" size={16} />
                    <span className="text-gray-600">Longest streak: {activityData?.longestStreak || 0} days</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className="w-3 h-3 rounded-sm border border-gray-200"
                        style={{ backgroundColor: getActivityColor(level) }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {renderActivityHeatmap()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-green-200 hover:bg-green-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {friend.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{friend.name}</p>
                        <div className="flex items-center gap-1">
                          <Flame className="text-orange-500" size={12} />
                          <span className="text-xs text-gray-600">{friend.currentStreak} day streak</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        friend.activityLevel === 'active' 
                          ? 'border-green-300 text-green-700' 
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      {friend.activityLevel}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Heatmap */}
      <section className="mb-8">
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2" size={20} />
              Training Activity
              <Badge variant="secondary" className="ml-2">
                {activityData?.totalContributions || 0} shots this year
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-green-600" size={16} />
                    <span className="text-gray-600">Current streak: {activityData?.weeklyStreak || 0} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="text-blue-600" size={16} />
                    <span className="text-gray-600">Longest streak: {activityData?.longestStreak || 0} days</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className="w-3 h-3 rounded-sm border border-gray-200"
                        style={{ backgroundColor: getActivityColor(level) }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {renderActivityHeatmap()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Friend Comparison Modal */}
      {selectedFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Training Comparison</span>
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-2">
                      <AvatarFallback>YOU</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">You</p>
                    <p className="text-sm text-gray-600">Level {leaderboardData?.currentPlayer?.currentLevel}</p>
                  </div>
                  <div className="text-2xl text-gray-400">VS</div>
                  <div className="text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-2">
                      <AvatarFallback>
                        {selectedFriend.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{selectedFriend.name}</p>
                    <p className="text-sm text-gray-600">Level {selectedFriend.level}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Shots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{leaderboardData?.currentPlayer?.totalClicks || 0}</span>
                      <span className="font-medium">{selectedFriend.totalShots}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current Streak</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{leaderboardData?.currentPlayer?.streakCount || 0} days</span>
                      <span className="font-medium">{selectedFriend.currentStreak} days</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Achievements</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{leaderboardData?.currentPlayer?.achievements?.length || 0}</span>
                      <span className="font-medium">{selectedFriend.achievements}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    {(leaderboardData?.currentPlayer?.totalClicks || 0) > selectedFriend.totalShots
                      ? "You're ahead in total shots! Keep up the great work!"
                      : "Your training partner is leading! Time to step up your game!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}