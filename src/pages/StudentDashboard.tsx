import FloatingShield from "@/components/3d/FloatingShield";
import ThreeDBackground from "@/components/3d/ThreeDBackground";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useTest } from "@/context/TestContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  LogOut,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { tests } = useTest();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || user.role !== "student") {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Get only published tests that students can take
  const availableTests = tests.filter((test) => test.status === "published");

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const subjectSet = new Set(availableTests.map((t) => t.subject));
    return ["all", ...Array.from(subjectSet)];
  }, [availableTests]);

  // Filter tests by search and subject
  const filteredTests = useMemo(() => {
    let filtered = availableTests;

    if (selectedSubject !== "all") {
      filtered = filtered.filter((t) => t.subject === selectedSubject);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [availableTests, selectedSubject, searchQuery]);

  // Mock stats (in real app, fetch from backend)
  const stats = useMemo(
    () => ({
      completed: 12,
      inProgress: 2,
      avgScore: 85,
      streak: 7,
    }),
    []
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6 relative overflow-hidden">
      <ThreeDBackground />

      {/* Floating decorations */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-10 h-60 w-60 rounded-full bg-primary/20 blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
        animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
        transition={{ duration: 9, repeat: Infinity }}
      />

      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 relative z-10"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="h-7 w-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Pariksha Protector
            </h1>
            <p className="text-xs text-muted-foreground">Student Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </Button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-primary/10">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{user.name}</span>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </motion.div>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mb-6"
      >
        <Card className="bg-gradient-to-br from-primary/20 via-violet-500/20 to-purple-500/20 backdrop-blur-xl border-primary/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/30 rounded-full blur-3xl" />
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">
                    {greeting}, {user.name.split(" ")[0]}!
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  You have {filteredTests.length} test
                  {filteredTests.length !== 1 ? "s" : ""} available. Ready to
                  ace them?
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    <Zap className="h-5 w-5" />
                    <span className="text-2xl font-bold">{stats.streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10"
      >
        {[
          {
            icon: <CheckCircle2 className="h-5 w-5" />,
            value: stats.completed,
            label: "Completed",
            color: "from-emerald-500 to-teal-500",
          },
          {
            icon: <Clock className="h-5 w-5" />,
            value: stats.inProgress,
            label: "In Progress",
            color: "from-blue-500 to-cyan-500",
          },
          {
            icon: <Trophy className="h-5 w-5" />,
            value: `${stats.avgScore}%`,
            label: "Avg Score",
            color: "from-amber-500 to-yellow-500",
          },
          {
            icon: <BookOpen className="h-5 w-5" />,
            value: availableTests.length,
            label: "Available",
            color: "from-purple-500 to-pink-500",
          },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="bg-card/60 backdrop-blur-md border-primary/10 hover:border-primary/30 transition-all group cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white group-hover:scale-110 transition-transform`}
                  >
                    {stat.icon}
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left Column - Profile & Achievements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Profile Card */}
          <Card className="bg-card/60 backdrop-blur-md border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCircle className="h-5 w-5 text-primary" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center mb-4 ring-4 ring-primary/20">
                    <div className="text-2xl font-bold text-white">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 border-4 border-card flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge
                  variant="secondary"
                  className="mt-2 bg-primary/20 text-primary"
                >
                  Student
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Performance</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Schedule</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-card/60 backdrop-blur-md border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-primary" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">First Perfect Score</p>
                    <p className="text-xs text-muted-foreground">
                      Achieved 100% on a test
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
                  <Target className="h-6 w-6 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Quick Learner</p>
                    <p className="text-xs text-muted-foreground">
                      Completed 10 tests
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className="bg-card/60 backdrop-blur-md border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Test Security</p>
                  <p className="text-xs text-muted-foreground">
                    Your activity is monitored during tests to ensure academic
                    integrity and fairness.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-full h-48">
            <FloatingShield />
          </div>
        </motion.div>

        {/* Right Column - Available Tests */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card/60 backdrop-blur-md border-primary/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Available Tests
                </CardTitle>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {filteredTests.length} shown
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tests by title or subject..."
                    className="pl-9 h-10"
                  />
                </div>

                <div className="flex items-center gap-1 bg-muted/50 border border-primary/10 rounded-lg p-1 overflow-x-auto">
                  {subjects.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap capitalize ${
                        selectedSubject === sub
                          ? "bg-primary text-white"
                          : "hover:bg-muted"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tests List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test, index) => (
                      <motion.div
                        key={test.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className="p-4 rounded-xl bg-accent/50 hover:bg-accent border border-transparent hover:border-primary/20 cursor-pointer transition-all group"
                        onClick={() => navigate(`/take-test/${test.id}`)}
                      >
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                                {test.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs border-primary/30"
                                >
                                  {test.subject}
                                </Badge>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {test.questions.length} questions
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {test.duration}m
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <Button className="w-full bg-gradient-to-r from-primary to-violet-500 hover:opacity-90">
                          <Zap className="mr-2 h-4 w-4" />
                          Start Test
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="mx-auto w-32 h-32 mb-4">
                        <FloatingShield />
                      </div>
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-xl font-medium mb-2">
                        No tests found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || selectedSubject !== "all"
                          ? "Try adjusting your search or filters"
                          : "There are no tests available at the moment. Check back later!"}
                      </p>
                      {(searchQuery || selectedSubject !== "all") && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedSubject("all");
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;