import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Users, ShieldCheck, Calendar, BookOpen, Layout } from "lucide-react";
import ThreeDBackground from "@/components/3d/ThreeDBackground";

const Landing = () => {
  const [activeTab, setActiveTab] = useState("features");
  const navigate = useNavigate();

  const features = [
    { 
      icon: <ShieldCheck className="h-12 w-12 text-primary" />,
      title: "Secure Monitoring", 
      description: "Advanced proctoring with cheating detection and violation tracking" 
    },
    { 
      icon: <BookOpen className="h-12 w-12 text-primary" />,
      title: "Versatile Testing", 
      description: "Support for multiple question types and test formats" 
    },
    { 
      icon: <Users className="h-12 w-12 text-primary" />,
      title: "Role-Based Access", 
      description: "Separate interfaces for students, faculty, and administrators" 
    },
    { 
      icon: <Calendar className="h-12 w-12 text-primary" />,
      title: "Flexible Scheduling", 
      description: "Set time limits and schedule tests for specific dates" 
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ThreeDBackground />
      
      {/* Header/Nav */}
      <header className="relative z-10 py-6 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <ShieldCheck className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-violet-300 bg-clip-text text-transparent">
            Pariksha Protector
          </h1>
        </div>
        <nav>
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Login
          </Button>
        </nav>
      </header>
      
      {/* Hero Section */}
      <motion.section 
        className="relative z-10 pt-12 pb-24 px-4 md:px-8 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              The Secure Exam <span className="bg-gradient-to-r from-primary to-violet-300 bg-clip-text text-transparent">Monitoring System</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Pariksha Protector ensures academic integrity with advanced proctoring technology and real-time monitoring for secure online examinations.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                className="mr-4"
                onClick={() => navigate("/login")}
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Learn More
              </Button>
            </motion.div>
          </div>
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="relative h-96 w-full bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-2xl backdrop-blur-sm border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-32 w-32 text-primary/60" />
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* About Section */}
      <section id="about" className="relative z-10 py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">About Pariksha Protector</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform combines cutting-edge technology with intuitive design to provide a comprehensive solution for online examinations.
          </p>
        </div>
        
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="w-full max-w-4xl mx-auto"
        >
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="faculty">For Faculty</TabsTrigger>
            <TabsTrigger value="students">For Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="features" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border-primary/20">
                  <CardHeader>
                    <div className="mb-2">{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="faculty" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle>Streamlined Test Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Create multiple-choice, true/false, and short-answer questions</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Set time limits and date constraints</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Monitor student activity during exams</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Receive alerts for suspicious behavior</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle>Seamless Test Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>User-friendly interface for taking tests</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Clear instructions and question navigation</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Real-time timer to track remaining time</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                    <span>Auto-save functionality to prevent data loss</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
      
      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Join thousands of educational institutions that trust Pariksha Protector for secure online examinations.
        </p>
        <Button size="lg" onClick={() => navigate("/login")}>
          Sign In Now
        </Button>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 md:px-8 border-t border-primary/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <ShieldCheck className="h-6 w-6 mr-2 text-primary" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Pariksha Protector. All rights reserved.
            </span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <button 
              onClick={() => navigate("/developers")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Meet the Team
            </button>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
