import ThreeDBackground from "@/components/3d/ThreeDBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Question, useTest } from "@/context/TestContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  Shield,
  Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const subjects = [
  "Ability Enhancement Course IV",
  "Software Engineering",
  "Cloud Computing Technologies",
  "Compiler Design",
  "Introduction to Machine Learning",
  "IOT Application and Communication",
];

const CODING_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

const CreateTest = () => {
  const { user, logout } = useAuth();
  const { createTest } = useTest();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [testTitle, setTestTitle] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [questions, setQuestions] = useState<Omit<Question, "id">[]>([
    {
      type: "mcq",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 5,
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || user.role !== "faculty") {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "mcq",
        text: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 5,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
    } else {
      toast({
        title: "Error",
        description: "You must have at least one question",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, DOC, DOCX, or TXT files only",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 20MB",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      toast({
        title: "File Uploaded",
        description: `${file.name} is ready for processing`,
      });
    }
  };

  const handleGenerateTest = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a document first",
        variant: "destructive",
      });
      return;
    }

    if (!subject) {
      toast({
        title: "Subject Required",
        description: "Please select a subject before generating",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const text = await uploadedFile.text();

      // Mock AI generation (replace with actual API call)
      const mockQuestions: Omit<Question, "id">[] = Array.from({ length: numberOfQuestions }, (_, i) => ({
        type: "mcq",
        text: `Generated question ${i + 1}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        marks: 5,
      }));

      setQuestions(mockQuestions);

      toast({
        title: "Test Generated Successfully!",
        description: `${mockQuestions.length} questions created. Review and edit as needed.`,
      });
    } catch (error) {
      console.error("Error generating test:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate test questions",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const validateTest = () => {
    if (!testTitle || !subject || duration <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all test details",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || q.marks <= 0) {
        toast({
          title: "Error",
          description: `Question ${i + 1} is incomplete`,
          variant: "destructive",
        });
        return false;
      }

      if (q.type === "mcq" && (!q.options || q.options.some((opt) => !opt))) {
        toast({
          title: "Error",
          description: `All options for Question ${i + 1} must be filled`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSaveTest = (status: "draft" | "published") => {
    if (!user) return;

    if (status === "published" && !validateTest()) {
      return;
    }

    const questionsWithIds: Question[] = questions.map((q, index) => ({
      ...q,
      id: `q${index + 1}`,
    }));

    createTest({
      title: testTitle || "Untitled Test",
      subject: subject || "Unspecified",
      duration,
      questions: questionsWithIds,
      createdBy: user.id,
      status,
    });

    toast({
      title: "Success",
      description: `Test ${status === "published" ? "published" : "saved as draft"}`,
    });

    navigate("/faculty-dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

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

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/faculty-dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10"
      >
        {/* AI Test Generator */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-md border-primary/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Test Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-file-upload">Upload Document (PDF, DOC, DOCX, TXT)</Label>
                <Input
                  id="ai-file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {uploadedFile && <p className="text-sm text-muted-foreground">Selected: {uploadedFile.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="num-questions">Number of Questions</Label>
                <Input
                  id="num-questions"
                  type="number"
                  min="5"
                  max="50"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 5)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerateTest}
              disabled={isGenerating || !uploadedFile || !subject}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Test...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Test with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Details */}
        <Card className="bg-card/90 backdrop-blur-md border-primary/20 mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Test Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-title">Test Title</Label>
                <Input
                  id="test-title"
                  placeholder="Enter test title"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateTest;