import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Users, Plus, Share2, Check, Home, Target, Activity } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  description: z.string().optional(),
});

const inviteSchema = z.object({
  inviteeEmail: z.string().email("Please enter a valid email address"),
});

interface Team {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  inviteCode: string;
  memberCount: number;
  createdAt: string;
  members?: Array<{
    id: number;
    userId: number;
    role: string;
    joinedAt: string;
  }>;
}

export default function Teams() {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["/api/teams/user/1"],
    enabled: true,
  });

  const { data: selectedTeamMembers = [], refetch: refetchMembers } = useQuery({
    queryKey: ["/api/teams", selectedTeam?.id, "members"],
    enabled: !!selectedTeam?.id,
  });

  const { data: selectedTeamProgress = [], refetch: refetchProgress } = useQuery({
    queryKey: ["/api/teams", selectedTeam?.id, "progress"],
    enabled: !!selectedTeam?.id,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTeamSchema>) => {
      console.log("Creating team with data:", data);
      return await apiRequest("POST", "/api/teams", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams/user/1"] });
      createTeamForm.reset();
      toast({
        title: "Team Created",
        description: "Your team has been created successfully!",
      });
      // Force close any open dialogs by resetting form state
      createTeamForm.setValue("name", "");
      createTeamForm.setValue("description", "");
    },
    onError: (error) => {
      console.error("Team creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async ({ teamId, inviteeEmail }: { teamId: number; inviteeEmail: string }) => {
      return await apiRequest("POST", `/api/teams/${teamId}/invites`, { inviteeEmail });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      console.log("Invite creation response:", data);
      
      toast({
        title: "Invite Created",
        description: `Invitation created! Link copied to clipboard.`,
      });
      
      // Copy invite link to clipboard
      if (data.inviteLink) {
        console.log("Copying invite link:", data.inviteLink);
        navigator.clipboard.writeText(data.inviteLink);
        setCopiedCode(data.invite?.inviteCode);
        setTimeout(() => setCopiedCode(null), 3000);
      } else {
        console.error("No invite link in response:", data);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invite",
        variant: "destructive",
      });
    },
  });

  const createTeamForm = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      inviteeEmail: "",
    },
  });

  const handleCreateTeam = async (data: z.infer<typeof createTeamSchema>) => {
    createTeamMutation.mutate(data);
  };

  const handleSendInvite = async (data: z.infer<typeof inviteSchema>) => {
    if (!selectedTeam) return;
    createInviteMutation.mutate({
      teamId: selectedTeam.id,
      inviteeEmail: data.inviteeEmail,
    });
  };

  const copyInviteLink = async (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(inviteCode);
    toast({
      title: "Invite Link Copied",
      description: "The invite link has been copied to your clipboard!",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Navigation */}
      <nav className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="mr-2" size={16} />
            Home
          </Button>
        </Link>
        <Link href="/goals">
          <Button variant="outline" size="sm">
            <Target className="mr-2" size={16} />
            Goals
          </Button>
        </Link>
        <Link href="/social">
          <Button variant="outline" size="sm">
            <Activity className="mr-2" size={16} />
            Social
          </Button>
        </Link>
      </nav>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Application Teams</h1>
          <p className="text-muted-foreground">
            Team up with others on your job search journey. Share progress, motivate each other, and compete in friendly challenges.
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Start a new team to collaborate on job applications with friends and colleagues.
              </DialogDescription>
            </DialogHeader>
            <Form {...createTeamForm}>
              <form onSubmit={createTeamForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                <FormField
                  control={createTeamForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Job Hunt Squad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createTeamForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A supportive group focused on landing our dream jobs in tech"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createTeamMutation.isPending}>
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams?.map((team: Team) => (
          <Card key={team.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {team.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {team.description || "No description provided"}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <p className="text-sm font-medium">Invite Code</p>
                  <p className="text-xs text-muted-foreground font-mono">{team.inviteCode}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyInviteLink(team.inviteCode)}
                  className="h-8 w-8 p-0"
                >
                  {copiedCode === team.inviteCode ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite to {team.name}</DialogTitle>
                      <DialogDescription>
                        Send an invitation link to someone to join your team.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...inviteForm}>
                      <form onSubmit={inviteForm.handleSubmit(handleSendInvite)} className="space-y-4">
                        <FormField
                          control={inviteForm.control}
                          name="inviteeEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="friend@example.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={createInviteMutation.isPending}>
                          {createInviteMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    toast({
                      title: "Create Invite",
                      description: "Use the invite button to generate a shareable link.",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!teams || teams.length === 0) && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first team to start collaborating on job applications with others.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Start a new team to collaborate on job applications with friends and colleagues.
                </DialogDescription>
              </DialogHeader>
              <Form {...createTeamForm}>
                <form onSubmit={createTeamForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                  <FormField
                    control={createTeamForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Job Hunt Squad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTeamForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="A supportive group focused on landing our dream jobs in tech"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createTeamMutation.isPending}>
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}