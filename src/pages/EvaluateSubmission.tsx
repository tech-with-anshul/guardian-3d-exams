
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, CheckCircle, Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  marks: number;
  correct_answer: string | null;
  options: any;
}

interface Answer {
  id: string;
  question_id: string;
  student_answer: string | null;
  marks_awarded: number | null;
  is_correct: boolean | null;
  graded_by: string | null;
}

const EvaluateSubmission = () => {
  const { testId, sessionId, studentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, { score: number; feedback: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "faculty") {
      navigate("/login");
      return;
    }

    loadData();
  }, [testId, sessionId, studentId, user, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch test details
      const { data: testData, error: testError } = await supabase
        .from("tests")
        .select("*")
        .eq("id", testId)
        .single();

      if (testError) throw testError;
      setTest(testData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("test_id", testId)
        .order("order_number");

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Fetch student profile
      const { data: studentData, error: studentError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Fetch answers
      const { data: answersData, error: answersError } = await supabase
        .from("answers")
        .select("*")
        .eq("session_id", sessionId);

      if (answersError) throw answersError;
      setAnswers(answersData || []);

      // Initialize evaluations from existing data
      const initialEvaluations: Record<string, { score: number; feedback: string }> = {};
      (answersData || []).forEach((answer: Answer) => {
        initialEvaluations[answer.question_id] = {
          score: answer.marks_awarded || 0,
          feedback: "",
        };
      });
      setEvaluations(initialEvaluations);

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load submission data.",
        variant: "destructive",
      });
      navigate("/faculty-dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (questionId: string, score: number, maxMarks: number) => {
    const clampedScore = Math.max(0, Math.min(score, maxMarks));
    setEvaluations(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        score: clampedScore,
      },
    }));
  };

  const handleFeedbackChange = (questionId: string, feedback: string) => {
    setEvaluations(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        feedback,
      },
    }));
  };

  const getAnswerForQuestion = (questionId: string) => {
    return answers.find(a => a.question_id === questionId);
  };

  const handleSaveAll = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updates = answers.map(answer => {
        const evaluation = evaluations[answer.question_id];
        return supabase
          .from("answers")
          .update({
            marks_awarded: evaluation?.score || 0,
            is_correct: (evaluation?.score || 0) > 0,
            graded_by: user.id,
            graded_at: new Date().toISOString(),
          })
          .eq("id", answer.id);
      });

      await Promise.all(updates);

      // Calculate total marks and update test_results
      const totalMarksObtained = Object.values(evaluations).reduce((sum, e) => sum + (e.score || 0), 0);
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      const percentage = totalMarks > 0 ? (totalMarksObtained / totalMarks) * 100 : 0;

      // Check if test_results exists
      const { data: existingResult } = await supabase
        .from("test_results")
        .select("id")
        .eq("session_id", sessionId)
        .single();

      if (existingResult) {
        await supabase
          .from("test_results")
          .update({
            marks_obtained: totalMarksObtained,
            percentage: percentage,
            is_passed: percentage >= (test?.passing_marks ? (test.passing_marks / totalMarks * 100) : 40),
            evaluated_by: user.id,
            evaluated_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId);
      } else {
        await supabase
          .from("test_results")
          .insert({
            session_id: sessionId,
            test_id: testId,
            student_id: studentId,
            total_marks: totalMarks,
            marks_obtained: totalMarksObtained,
            percentage: percentage,
            is_passed: percentage >= 40,
            evaluated_by: user.id,
            evaluated_at: new Date().toISOString(),
          });
      }

      toast({
        title: "Evaluation Saved",
        description: `Total marks: ${totalMarksObtained}/${totalMarks} (${percentage.toFixed(1)}%)`,
      });

      navigate(`/test-dashboard/${testId}`);
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to save evaluation.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalMarksObtained = Object.values(evaluations).reduce((sum, e) => sum + (e.score || 0), 0);
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/test-dashboard/${testId}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Evaluate Submission</h1>
      </div>

      {/* Student Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{test?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-medium">{student?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{student?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-medium">{totalMarksObtained}/{totalMarks} marks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions and Answers */}
      <div className="space-y-6">
        {questions.map((question, index) => {
          const answer = getAnswerForQuestion(question.id);
          const evaluation = evaluations[question.id] || { score: 0, feedback: "" };
          const isGraded = answer?.graded_by !== null;

          return (
            <Card key={question.id} className={isGraded ? "border-green-500/50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {index + 1}
                    <Badge variant="outline" className="ml-2">
                      {question.question_type.toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <Badge variant={isGraded ? "default" : "secondary"}>
                    {isGraded ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Graded
                      </>
                    ) : (
                      "Pending"
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Question:</p>
                  <p className="p-3 bg-muted rounded-md">{question.question_text}</p>
                </div>

                {question.correct_answer && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                    <p className="p-3 bg-green-500/10 text-green-600 rounded-md">{question.correct_answer}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Student's Answer:</p>
                  {answer?.student_answer ? (
                    <p className="p-3 bg-muted rounded-md whitespace-pre-wrap">{answer.student_answer}</p>
                  ) : (
                    <p className="p-3 bg-muted rounded-md italic text-muted-foreground">No answer provided</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Score (max: {question.marks})
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={question.marks}
                      value={evaluation.score}
                      onChange={(e) => handleScoreChange(question.id, parseInt(e.target.value) || 0, question.marks)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Feedback (optional)
                    </label>
                    <Textarea
                      value={evaluation.feedback}
                      onChange={(e) => handleFeedbackChange(question.id, e.target.value)}
                      placeholder="Enter feedback..."
                      rows={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-6 mt-6">
        <Card className="bg-card/95 backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Total Score: {totalMarksObtained}/{totalMarks}</p>
              <p className="text-sm text-muted-foreground">
                {totalMarks > 0 ? ((totalMarksObtained / totalMarks) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <Button onClick={handleSaveAll} disabled={isSaving} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Evaluation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EvaluateSubmission;
