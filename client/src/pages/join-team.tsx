import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function JoinTeam() {
  const [, params] = useRoute("/join/:inviteCode");
  const { toast } = useToast();
  const [joinStatus, setJoinStatus] = useState<'pending' | 'joined' | 'failed'>('pending');

  const inviteCode = params?.inviteCode;

  const { data: inviteData, isLoading, error } = useQuery({
    queryKey: ["/api/invites", inviteCode],
    enabled: !!inviteCode,
  });

  const joinTeamMutation = useMutation({
    mutationFn: async () => {
      console.log("Joining team with invite code:", inviteCode);
      return await apiRequest("POST", `/api/invites/${inviteCode}/accept`, {});
    },
    onSuccess: (response) => {
      console.log("Join team success:", response);
      setJoinStatus('joined');
      toast({
        title: "Welcome to the Team!",
        description: "You have successfully joined the team.",
      });
    },
    onError: (error) => {
      console.error("Join team error:", error);
      setJoinStatus('failed');
      toast({
        title: "Failed to Join",
        description: "Unable to join the team. The invite may be expired or invalid.",
        variant: "destructive",
      });
    },
  });

  const handleJoinTeam = () => {
    if (inviteCode) {
      joinTeamMutation.mutate();
    }
  };

  if (!inviteCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <CardTitle>Invalid Invite Link</CardTitle>
            <CardDescription>
              This invite link appears to be invalid or incomplete.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/teams">
              <Button>Go to Teams</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="w-16 h-16 mx-auto text-blue-500 mb-4 animate-spin" />
            <CardTitle>Loading Invite...</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <CardTitle>Invite Not Found</CardTitle>
            <CardDescription>
              This invite link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/teams">
              <Button>Go to Teams</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joinStatus === 'joined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <CardTitle>Welcome to {inviteData.team?.name}!</CardTitle>
            <CardDescription>
              You have successfully joined the team. Start collaborating with your teammates!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Link href="/teams">
              <Button className="w-full">View Your Teams</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joinStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <CardTitle>Failed to Join Team</CardTitle>
            <CardDescription>
              Something went wrong while trying to join the team. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={handleJoinTeam} disabled={joinTeamMutation.isPending} className="w-full">
              {joinTeamMutation.isPending ? "Trying Again..." : "Try Again"}
            </Button>
            <Link href="/teams">
              <Button variant="outline" className="w-full">Go to Teams</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <CardTitle>Join Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">{inviteData.team?.name}</h3>
            {inviteData.team?.description && (
              <p className="text-gray-600">{inviteData.team.description}</p>
            )}
            <Badge variant="secondary">
              Team ID: {inviteData.team?.id}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleJoinTeam} 
              disabled={joinTeamMutation.isPending}
              className="w-full"
              size="lg"
            >
              {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
            </Button>
            
            <Link href="/teams">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}