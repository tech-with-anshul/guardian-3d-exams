
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTest } from "@/context/TestContext";
import ThreeDBackground from "@/components/3d/ThreeDBackground";
import FloatingShield from "@/components/3d/FloatingShield";
import { Plus, LogOut, Book, Shield, Activity, BarChart2 } from "lucide-react";

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const { tests } = useTest();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || user.role !== "faculty") {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Get only tests created by this faculty
  const facultyTests = tests.filter(test => test.createdBy === user.id);
  
  // Calculate test statistics
  const publishedTests = facultyTests.filter(test => test.status === "published").length;
  const draftTests = facultyTests.filter(test => test.status === "draft").length;
  const totalQuestions = facultyTests.reduce((acc, test) => acc + test.questions.length, 0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-6">
      <ThreeDBackground />
      
      {/* Top Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-between items-center mb-8 relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Pariksha Protector</h1>
        </div>
        
        <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </motion.div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left Column - Profile */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="bg-card/90 backdrop-blur-md border-primary/20 h-full">
            <CardHeader className="pb-2">
              <CardTitle>Faculty Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <div className="text-3xl font-bold">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </div>
                </div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <h4 className="font-medium mb-2">Test Statistics</h4>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-accent p-4 rounded-lg text-center">
                  <p className="text-lg font-bold">{facultyTests.length}</p>
                  <p className="text-xs text-muted-foreground">Total Tests</p>
                </div>
                <div className="bg-accent p-4 rounded-lg text-center">
                  <p className="text-lg font-bold">{publishedTests}</p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
                <div className="bg-accent p-4 rounded-lg text-center">
                  <p className="text-lg font-bold">{draftTests}</p>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                </div>
                <div className="bg-accent p-4 rounded-lg text-center">
                  <p className="text-lg font-bold">{totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
              </div>
              
              <Button 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => navigate("/create-test")}
              >
                <Plus className="h-4 w-4" />
                Create New Test
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Right Column - Tests */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card/90 backdrop-blur-md border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle>Your Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {facultyTests.length > 0 ? (
                  facultyTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-accent hover:bg-accent/80 cursor-pointer transition-colors"
                    >
                      <div 
                        className="flex items-center gap-3 flex-1"
                        onClick={() => navigate(`/test-dashboard/${test.id}`)}
                      >
                        <div className="p-2 rounded-md bg-primary/20">
                          <Book className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{test.title}</h4>
                          <p className="text-sm text-muted-foreground">{test.subject} • {test.questions.length} Questions</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          test.status === "published" 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {test.status === "published" ? "Published" : "Draft"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {test.duration} mins
                        </span>
                        
                        {test.status === "published" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/test-dashboard/${test.id}`);
                            }}
                          >
                            <BarChart2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Monitor</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-32 h-32 mb-4">
                      <FloatingShield />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No tests yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first test to get started
                    </p>
                    <Button 
                      onClick={() => navigate("/create-test")}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Test
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
