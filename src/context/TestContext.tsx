
import { createContext, useContext, ReactNode, useState, useEffect } from "react";

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
  unique_id?: string; // Add unique test ID
}

interface TestContextType {
  tests: Test[];
  isLoading: boolean;
  createTest: (test: Omit<Test, "id" | "createdAt">) => Promise<void>;
  getTestById: (id: string) => Test | undefined;
  updateTest: (id: string, test: Partial<Test>) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  generateUniqueTestId: () => string;
}


const TestContext = createContext<TestContextType | undefined>(undefined);

// Initial mock test data
const INITIAL_TESTS: Test[] = [
  {
    id: "88888888-8888-8888-8888-888888888888",
    title: "Data Structures and Algorithms Test",
    subject: "Computer Science",
    duration: 60,
    createdBy: "11111111-1111-1111-1111-111111111111",
    createdAt: new Date(),
    status: "published",
    unique_id: "TST-DSA001",
    questions: [
      {
        id: "99999999-9999-9999-9999-999999999999",
        type: "mcq",
        text: "What is the time complexity of binary search?",
        marks: 5,
        options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
        correctAnswer: "O(log n)"
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        type: "short",
        text: "Explain the difference between stack and queue data structures.",
        marks: 10
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        type: "coding",
        text: "Write a function to reverse a linked list.",
        marks: 15,
        codingLanguage: "java",
        starterCode: "public ListNode reverseList(ListNode head) {\n    // Your code here\n    return null;\n}",
        expectedOutput: "Reversed linked list",
        testCases: [
          {
            input: "1->2->3->4->5",
            expectedOutput: "5->4->3->2->1",
            description: "Basic test case"
          }
        ]
      }
    ]
  }
];

export function TestProvider({ children }: { children: ReactNode }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize tests from localStorage on mount
  useEffect(() => {
    const initializeTests = () => {
      const storedTests = localStorage.getItem("pariksha_tests");
      if (storedTests) {
        try {
          const parsed = JSON.parse(storedTests) as Test[];
          const testsWithDates = parsed.map(test => ({
            ...test,
            createdAt: new Date(test.createdAt)
          }));
          setTests(testsWithDates);
        } catch (error) {
          console.error("Error parsing stored tests:", error);
          // Initialize with default tests if parsing fails
          setTests(INITIAL_TESTS);
          localStorage.setItem("pariksha_tests", JSON.stringify(INITIAL_TESTS));
        }
      } else {
        // Initialize with default tests
        setTests(INITIAL_TESTS);
        localStorage.setItem("pariksha_tests", JSON.stringify(INITIAL_TESTS));
      }
      setIsLoading(false);
    };

    initializeTests();
  }, []);

  const generateUniqueTestId = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TST-${randomPart}`;
  };

  const createTest = async (test: Omit<Test, "id" | "createdAt">) => {
    setIsLoading(true);
    
    const newTest: Test = {
      id: crypto.randomUUID(),
      title: test.title,
      subject: test.subject,
      duration: test.duration,
      createdBy: test.createdBy,
      createdAt: new Date(),
      status: test.status,
      unique_id: test.unique_id || generateUniqueTestId(),
      questions: test.questions.map(q => ({
        ...q,
        id: q.id || crypto.randomUUID()
      })),
    };

    const updatedTests = [newTest, ...tests];
    setTests(updatedTests);
    localStorage.setItem("pariksha_tests", JSON.stringify(updatedTests));
    
    setIsLoading(false);
  };

  const updateTest = async (id: string, updatedFields: Partial<Test>) => {
    setIsLoading(true);
    
    const updatedTests = tests.map(test => 
      test.id === id 
        ? { 
            ...test, 
            ...updatedFields,
            questions: updatedFields.questions ? updatedFields.questions.map(q => ({
              ...q,
              id: q.id || crypto.randomUUID()
            })) : test.questions
          }
        : test
    );
    
    setTests(updatedTests);
    localStorage.setItem("pariksha_tests", JSON.stringify(updatedTests));
    
    setIsLoading(false);
  };

  const deleteTest = async (id: string) => {
    setIsLoading(true);
    
    const updatedTests = tests.filter(test => test.id !== id);
    setTests(updatedTests);
    localStorage.setItem("pariksha_tests", JSON.stringify(updatedTests));
    
    setIsLoading(false);
  };

  const getTestById = (id: string) => {
    return tests.find((test) => test.id === id);
  };

  const value: TestContextType = {
    tests,
    isLoading,
    createTest,
    updateTest,
    deleteTest,
    getTestById,
    generateUniqueTestId,
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
