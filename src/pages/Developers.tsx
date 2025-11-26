
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Linkedin, Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThreeDBackground from "@/components/3d/ThreeDBackground";

const Developers = () => {
  const navigate = useNavigate();

  const developers = [
    {
      id: 1,
      name: "Anshul",
      email: "Kanshulmussoorie@gmail.com",
      linkedin: "https://www.linkedin.com/in/anshultech1/",
      image: "https://media.licdn.com/dms/image/v2/D5603AQEYR2REUOBxlg/profile-displayphoto-shrink_200_200/B56ZVHepwuGQAc-/0/1740660975348?e=1755734400&v=beta&t=FTyAekTbNAYGp9SU4FDQXjUzwP6FPW2zjanexOx8L-I",
      role: "Developer"
    },
    {
      id: 2,
      name: "Ishika Saxena",
      email: "ishikasaxena2306@gmail.com",
      linkedin: "https://www.linkedin.com/in/ishika-saxena-/",
      image: "https://media.licdn.com/dms/image/v2/D5603AQHGLOR7oxc-aw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730450812301?e=1755734400&v=beta&t=Ehkn7jXRsphCyLrO021hygkyn14fO-XAeLgPh-wwEas",
      role: "Developer"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ThreeDBackground />
      
      {/* Header */}
      <header className="relative z-10 py-6 px-4 md:px-8 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </header>

      {/* Main Content */}
      <div className="relative z-10 px-4 md:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Meet Our <span className="bg-gradient-to-r from-primary to-violet-300 bg-clip-text text-transparent">Development Team</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The talented developers behind Pariksha Protector
          </p>
        </motion.div>

        {/* Developers Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {developers.map((developer, index) => (
            <motion.div
              key={developer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
            >
              <Card className="bg-card/90 backdrop-blur-md border-primary/20 h-full">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage 
                        src={developer.image} 
                        alt={developer.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl font-bold bg-primary/20">
                        {developer.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-2xl">{developer.name}</CardTitle>
                  <p className="text-primary font-medium">{developer.role}</p>
                </CardHeader>
                
                <CardContent className="text-center space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => window.open(`mailto:${developer.email}`, '_blank')}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => window.open(developer.linkedin, '_blank')}
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-sm text-muted-foreground">
                      {developer.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Developers;
