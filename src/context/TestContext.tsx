
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface Question {
  id: string;
  type: "mcq" | "essay" | "truefalse" | "short" | "long" | "image" | "coding";
  text: string;
  options?: string[];
  correctAnswer?: string | boolean;
  marks: number;
  answerHint?: string;
  imagePrompt?: string;
  codingLanguage?: string;
  starterCode?: string;
  expectedOutput?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description?: string;
  }>;
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  questions: Question[];
  createdBy: string;
  createdAt: Date;
  status: "draft" | "published";
  unique_id?: string;
}

interface TestContextType {
  tests: Test[];
  isLoading: boolean;
  createTest: (test: Omit<Test, "id" | "createdAt">) => Promise<void>;
  getTestById: (id: string) => Test | undefined;
  updateTest: (id: string, test: Partial<Test>) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  generateUniqueTestId: () => string;
  refreshTests: () => Promise<void>;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export function TestProvider({ children }: { children: ReactNode }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTests = async () => {
    try {
      const { data: testsData, error: testsError } = await supabase
        .from("tests")
        .select(`
          *,
          questions (*)
        `)
        .order("created_at", { ascending: false });

      if (testsError) {
        console.error("Error fetching tests:", testsError);
        return;
      }

      if (testsData) {
        const transformedTests: Test[] = testsData.map((test) => ({
          id: test.id,
          title: test.title,
          subject: test.subject,
          duration: test.duration_minutes,
          createdBy: test.created_by,
          createdAt: new Date(test.created_at),
          status: test.test_type === "mcq" ? "published" : "published",
          unique_id: test.test_id,
          questions: (test.questions || []).map((q: any) => ({
            id: q.id,
            type: q.question_type as Question["type"],
            text: q.question_text,
            options: q.options as string[] | undefined,
            correctAnswer: q.correct_answer,
            marks: q.marks,
          })).sort((a: any, b: any) => a.order_number - b.order_number),
        }));

        setTests(transformedTests);
      }
    } catch (error) {
      console.error("Error in fetchTests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const generateUniqueTestId = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TST-${randomPart}`;
  };

  const createTest = async (test: Omit<Test, "id" | "createdAt">) => {
    setIsLoading(true);

    try {
      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a test.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const testId = generateUniqueTestId();
      
      // Map question type to database enum
      const mapQuestionType = (type: string): "mcq" | "truefalse" | "short" | "descriptive" | "image" => {
        switch (type) {
          case "mcq": return "mcq";
          case "truefalse": return "truefalse";
          case "short": return "short";
          case "long":
          case "essay":
          case "coding":
            return "descriptive";
          case "image": return "image";
          default: return "short";
        }
      };

      // Determine test type based on questions
      const hasOnlyMcq = test.questions.every(q => q.type === "mcq" || q.type === "truefalse");
      const hasOnlyDescriptive = test.questions.every(q => ["short", "long", "essay", "coding"].includes(q.type));
      const testType = hasOnlyMcq ? "mcq" : hasOnlyDescriptive ? "descriptive" : "mixed";

      // Calculate total marks
      const totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);

      // Insert test into database - use authenticated user's ID
      const { data: newTest, error: testError } = await supabase
        .from("tests")
        .insert({
          title: test.title,
          subject: test.subject,
          duration_minutes: test.duration,
          created_by: user.id, // Use authenticated user's ID
          test_id: testId,
          test_type: testType,
          total_marks: totalMarks,
          passing_marks: Math.floor(totalMarks * 0.4),
        })
        .select()
        .single();

      if (testError) {
        console.error("Error creating test:", testError);
        toast({
          title: "Error",
          description: testError.message.includes("row-level security") 
            ? "You don't have permission to create tests. Please ensure you have faculty or admin role."
            : "Failed to create test. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Insert questions
      const questionsToInsert = test.questions.map((q, index) => ({
        test_id: newTest.id,
        question_text: q.text,
        question_type: mapQuestionType(q.type),
        options: q.options ? q.options : null,
        correct_answer: q.correctAnswer?.toString() || null,
        marks: q.marks,
        order_number: index + 1,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) {
        console.error("Error creating questions:", questionsError);
        toast({
          title: "Warning",
          description: "Test created but some questions failed to save.",
          variant: "destructive",
        });
      }

      // Refresh tests list
      await fetchTests();

      toast({
        title: "Success",
        description: "Test created successfully!",
      });
    } catch (error) {
      console.error("Error in createTest:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTest = async (id: string, updatedFields: Partial<Test>) => {
    setIsLoading(true);

    try {
      const updateData: any = {};
      
      if (updatedFields.title) updateData.title = updatedFields.title;
      if (updatedFields.subject) updateData.subject = updatedFields.subject;
      if (updatedFields.duration) updateData.duration_minutes = updatedFields.duration;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("tests")
          .update(updateData)
          .eq("id", id);

        if (error) {
          console.error("Error updating test:", error);
          toast({
            title: "Error",
            description: "Failed to update test.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      await fetchTests();

      toast({
        title: "Success",
        description: "Test updated successfully!",
      });
    } catch (error) {
      console.error("Error in updateTest:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTest = async (id: string) => {
    setIsLoading(true);

    try {
      // Delete questions first (due to foreign key constraint)
      const { error: questionsError } = await supabase
        .from("questions")
        .delete()
        .eq("test_id", id);

      if (questionsError) {
        console.error("Error deleting questions:", questionsError);
      }

      // Delete the test
      const { error: testError } = await supabase
        .from("tests")
        .delete()
        .eq("id", id);

      if (testError) {
        console.error("Error deleting test:", testError);
        toast({
          title: "Error",
          description: "Failed to delete test.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      await fetchTests();

      toast({
        title: "Success",
        description: "Test deleted successfully!",
      });
    } catch (error) {
      console.error("Error in deleteTest:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTestById = (id: string) => {
    return tests.find((test) => test.id === id);
  };

  const refreshTests = async () => {
    setIsLoading(true);
    await fetchTests();
  };

  const value: TestContextType = {
    tests,
    isLoading,
    createTest,
    updateTest,
    deleteTest,
    getTestById,
    generateUniqueTestId,
    refreshTests,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
}

export function useTest() {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error("useTest must be used within a TestProvider");
  }
  return context;
}
