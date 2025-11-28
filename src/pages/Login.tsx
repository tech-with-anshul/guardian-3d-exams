import ThreeDBackground from "@/components/3d/ThreeDBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, UserRole } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, Shield, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("faculty");
  const { toast } = useToast();
  const { login, signup, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "faculty") {
        navigate("/faculty-dashboard");
      } else if (user.role === "student") {
        navigate("/student-dashboard");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && !fullName) {
      toast({
        title: "Missing Information",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const result = await signup(email, password, fullName, selectedRole);
        
        if (result.success) {
          toast({
            title: "Account Created!",
            description: "You can now sign in with your credentials.",
          });
          setIsSignUp(false);
          setFullName("");
        } else {
          toast({
            title: "Signup Failed",
            description: result.error || "Please try again.",
            variant: "destructive",
          });
        }
      } else {
        const result = await login(email, password);
        
        if (result.success) {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in",
          });
        } else {
          toast({
            title: "Login Failed",
            description: result.error || "Invalid credentials. Please check and try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === "faculty") return <User className="h-5 w-5" />;
    if (role === "student") return <GraduationCap className="h-5 w-5" />;
    return <Shield className="h-5 w-5" />;
  };

  const getRoleColor = (role: UserRole) => {
    if (role === "faculty") return "from-blue-500 to-cyan-500";
    if (role === "student") return "from-emerald-500 to-teal-500";
    return "from-purple-500 to-pink-500";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <ThreeDBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 w-full max-w-md"
      >
        <Card className="bg-card/90 backdrop-blur-xl border-primary/10 shadow-2xl shadow-black/10">
          <CardHeader className="space-y-3 text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Pariksha Protector
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {isSignUp ? "Create your account" : "Sign in to your account"}
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {/* Role selector for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Role</Label>
                  <Tabs 
                    value={selectedRole || "faculty"} 
                    onValueChange={(value) => setSelectedRole(value as UserRole)}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger 
                        value="faculty"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                      >
                        <User className="w-4 h-4 mr-1" />
                        Faculty
                      </TabsTrigger>
                      <TabsTrigger 
                        value="student"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
                      >
                        <GraduationCap className="w-4 h-4 mr-1" />
                        Student
                      </TabsTrigger>
                      <TabsTrigger 
                        value="admin"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Admin
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {/* Full Name field for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                      required={isSignUp}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="pl-10 h-11"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    disabled={isLoading}
                    required
                    className="pl-10 pr-10 h-11"
                    placeholder={isSignUp ? "Create a password (min 6 chars)" : "Enter your password"}
                    minLength={isSignUp ? 6 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pb-6">
              <Button 
                type="submit" 
                className={`w-full h-11 font-medium bg-gradient-to-r ${getRoleColor(selectedRole)} hover:opacity-90 transition-all shadow-lg shadow-primary/25`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating Account..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    {getRoleIcon(selectedRole)}
                    <span className="ml-2">{isSignUp ? "Create Account" : "Sign In"}</span>
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setFullName("");
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"}
                </button>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our{" "}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer branding */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          © 2025 Pariksha Protector. Secure & Reliable Examination System.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
