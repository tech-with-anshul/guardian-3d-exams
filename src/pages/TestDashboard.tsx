
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTest } from "@/context/TestContext";
import TestSessionsChart from "@/components/TestSessionsChart";
import StudentWarningsTable from "@/components/StudentWarningsTable";

// Mock data for student sessions
const mockSessions = [
  { id: "1", student_id: "s1", erp_id: "1902112", name: "John Doe", warnings: 4, status: "active", message: "Multiple People Detected" },
  { id: "2", student_id: "s2", erp_id: "1902113", name: "Jane Smith", warnings: 0, status: "active", message: "" },
  { id: "3", student_id: "s3", erp_id: "1902114", name: "Bob Brown", warnings: 1, status: "active", message: "Looking Away Detected" },
  { id: "4", student_id: "s4", erp_id: "1902115", name: "Alice Green", warnings: 2, status: "active", message: "Multiple People Detected" },
  { id: "5", student_id: "s5", erp_id: "1902116", name: "Charlie Wilson", warnings: 5, status: "terminated", message: "Multiple People Detected" },
];

const TestDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getTestById } = useTest();
  const [testSessions, setTestSessions] = useState(mockSessions);

  const test = getTestById(id || "");

  useEffect(() => {
    if (!test) {
      navigate("/faculty-dashboard");
    }
  }, [test, navigate]);

  if (!test) return null;

  // Calculate statistics
  const activeStudents = testSessions.filter(session => session.status === "active").length;
  const terminatedStudents = testSessions.filter(session => session.status === "terminated").length;

  const handleCopyTestId = () => {
    if (test.unique_id) {
      navigator.clipboard.writeText(test.unique_id);
      toast({
        title: "Test ID Copied",
        description: "The test ID has been copied to your clipboard.",
      });
    }
  };

  const handleTerminateStudent = (sessionId: string) => {
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

  const handleContinueStudent = (sessionId: string) => {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <CardTitle>Terminated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{terminatedStudents}</div>
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
