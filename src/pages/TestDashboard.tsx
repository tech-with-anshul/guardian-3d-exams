
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTest } from "@/context/TestContext";
import { supabase } from "@/integrations/supabase/client";
import TestSessionsChart from "@/components/TestSessionsChart";
import StudentWarningsTable from "@/components/StudentWarningsTable";

interface TestSession {
  id: string;
  student_id: string;
  erp_id: string;
  name: string;
  warnings: number;
  status: string;
  message: string;
  submitted_at: string | null;
}

const TestDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getTestById } = useTest();
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const test = getTestById(id || "");

  // Fetch real sessions from Supabase
  useEffect(() => {
    if (!id) return;

    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const { data: sessions, error } = await supabase
          .from("test_sessions")
          .select(`
            id,
            student_id,
            status,
            total_warnings,
            submitted_at,
            profiles:student_id (
              full_name,
              email
            )
          `)
          .eq("test_id", id);

        if (error) {
          console.error("Error fetching sessions:", error);
          toast({
            title: "Error",
            description: "Failed to load test sessions.",
            variant: "destructive",
          });
          return;
        }

        const formattedSessions: TestSession[] = (sessions || []).map((session: any) => ({
          id: session.id,
          student_id: session.student_id,
          erp_id: session.profiles?.email?.split("@")[0] || "N/A",
          name: session.profiles?.full_name || "Unknown Student",
          warnings: session.total_warnings || 0,
          status: session.status === "submitted" ? "submitted" : session.status === "terminated" ? "terminated" : "active",
          message: "",
          submitted_at: session.submitted_at,
        }));

        setTestSessions(formattedSessions);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();

    // Set up realtime subscription
    const channel = supabase
      .channel(`test-sessions-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "test_sessions",
          filter: `test_id=eq.${id}`,
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, toast]);

  useEffect(() => {
    if (!test && !isLoading) {
      navigate("/faculty-dashboard");
    }
  }, [test, navigate, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!test) return null;

  // Calculate statistics
  const activeStudents = testSessions.filter(session => session.status === "active" || session.status === "in_progress").length;
  const terminatedStudents = testSessions.filter(session => session.status === "terminated").length;
  const submittedStudents = testSessions.filter(session => session.status === "submitted").length;

  const handleCopyTestId = () => {
    if (test.unique_id) {
      navigator.clipboard.writeText(test.unique_id);
      toast({
        title: "Test ID Copied",
        description: "The test ID has been copied to your clipboard.",
      });
    }
  };

  const handleTerminateStudent = async (sessionId: string) => {
    const { error } = await supabase
      .from("test_sessions")
      .update({ status: "terminated" })
      .eq("id", sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to terminate student.",
        variant: "destructive",
      });
      return;
    }

    setTestSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: "terminated" } 
          : session
      )
    );
    
    toast({
      title: "Student Terminated",
      description: "The student has been removed from the test.",
      variant: "destructive"
    });
  };

  const handleContinueStudent = async (sessionId: string) => {
    const { error } = await supabase
      .from("test_sessions")
      .update({ status: "in_progress" })
      .eq("id", sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to continue student.",
        variant: "destructive",
      });
      return;
    }

    setTestSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: "active" } 
          : session
      )
    );
    
    toast({
      title: "Student Continued",
      description: "The student can continue the test.",
    });
  };

  const handleEvaluateSubmission = (sessionId: string, studentId: string) => {
    navigate(`/evaluate-submission/${id}/${sessionId}/${studentId}`);
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/faculty-dashboard")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Test Dashboard</h1>
      </div>

      {/* Test Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{test.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium">{test.subject}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{test.duration} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  test.status === "published" 
                    ? "bg-green-500/20 text-green-500" 
                    : "bg-yellow-500/20 text-yellow-500"
                }`}>
                  {test.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Questions:</span>
                <span className="font-medium">{test.questions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Test ID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted p-2 rounded-md text-center font-mono">
                {test.unique_id || "TST-XXXXXXXX"}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyTestId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Share this ID with students to allow them to access the test.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeStudents}</div>
            <p className="text-sm text-muted-foreground">Currently taking the test</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{submittedStudents}</div>
            <p className="text-sm text-muted-foreground">Completed the test</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Terminated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{terminatedStudents}</div>
            <p className="text-sm text-muted-foreground">Removed from test</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{testSessions.length}</div>
            <p className="text-sm text-muted-foreground">Joined the test</p>
          </CardContent>
        </Card>
      </div>

      {/* Submitted Tests for Evaluation */}
      {submittedStudents > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Submissions Ready for Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testSessions
                .filter(session => session.status === "submitted")
                .map((session) => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{session.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ERP: {session.erp_id} • Warnings: {session.warnings}
                        {session.submitted_at && (
                          <> • Submitted: {new Date(session.submitted_at).toLocaleString()}</>
                        )}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleEvaluateSubmission(session.id, session.student_id)}
                      className="flex items-center gap-2"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Evaluate
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Students with Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <TestSessionsChart sessions={testSessions} />
          </div>
        </CardContent>
      </Card>

      {/* Student warnings table */}
      <Card>
        <CardHeader>
          <CardTitle>Students Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentWarningsTable 
            sessions={testSessions} 
            onTerminate={handleTerminateStudent} 
            onContinue={handleContinueStudent}
            testId={id || ""} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDashboard;
