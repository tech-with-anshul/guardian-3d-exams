import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, User } from "@/context/AuthContext";
import { Layout, Users, FileText, Loader2 } from "lucide-react";
import UserTable from "@/components/admin/UserTable";
import StatsCard from "@/components/admin/StatsCard";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { supabase } from "@/integrations/supabase/client";

interface ProfileWithRole extends User {
  roleFromDb?: string;
}

const AdminPanel = () => {
  const [activeMainTab, setActiveMainTab] = useState("users");
  const [activeUserTab, setActiveUserTab] = useState("faculty");
  const [facultyList, setFacultyList] = useState<ProfileWithRole[]>([]);
  const [studentsList, setStudentsList] = useState<ProfileWithRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [activityLogs, setActivityLogs] = useState<string[]>([
    "Admin logged in at 09:23 AM",
    "System backup completed at 12:00 PM",
  ]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      
      // Fetch all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Map profiles with roles
      const usersWithRoles = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          name: profile.full_name,
          email: profile.email,
          role: userRole?.role || null,
        } as ProfileWithRole;
      });

      setFacultyList(usersWithRoles.filter((u) => u.role === "faculty"));
      setStudentsList(usersWithRoles.filter((u) => u.role === "student"));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (!isLoading && user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel",
        variant: "destructive",
      });
      navigate(user.role === "faculty" ? "/faculty-dashboard" : "/student-dashboard");
    }
  }, [user, isAuthenticated, isLoading, navigate, toast]);

  const addActivityLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [`${message} at ${timestamp}`, ...prev.slice(0, 9)]);
  };

  const handleMainTabChange = (value: string) => {
    setActiveMainTab(value);
    addActivityLog(`Navigated to ${value} section`);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Layout className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Panel</h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard 
              title="Total Faculty" 
              value={facultyList.length} 
              icon={<Users className="h-8 w-8" />} 
            />
            <StatsCard 
              title="Total Students" 
              value={studentsList.length} 
              icon={<Users className="h-8 w-8" />} 
            />
            <StatsCard 
              title="Active Tests" 
              value="3" 
              icon={<FileText className="h-8 w-8" />} 
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AdminNavigation 
                activeMainTab={activeMainTab}
                onTabChange={handleMainTabChange}
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Manage Users</CardTitle>
                    <CardDescription>
                      View faculty and students in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Tabs 
                        defaultValue={activeUserTab} 
                        onValueChange={setActiveUserTab}
                        className="w-full"
                      >
                        <TabsList className="mb-6">
                          <TabsTrigger value="faculty">Faculty</TabsTrigger>
                          <TabsTrigger value="students">Students</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="faculty">
                          <Card>
                            <CardContent className="p-0">
                              <UserTable 
                                users={facultyList}
                                role="faculty"
                              />
                            </CardContent>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="students">
                          <Card>
                            <CardContent className="p-0">
                              <UserTable 
                                users={studentsList}
                                role="student"
                              />
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </AdminNavigation>
            </div>
            
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>
                    Recent system activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className="text-sm p-2 border-l-4 border-primary/30 pl-3 bg-muted/30"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
