"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  FileText, 
  BarChart3, 
  Calendar, 
  MessageCircle, 
  Bot,
  Menu
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const appState = useSelector((state: RootState) => state.app);
  const router = useRouter();

  useEffect(() => {
    if (appState.user.loggedIn) {
      router.push('/home');
    }
  }, [appState.user.loggedIn, router]);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Studious" className="w-6 h-6" />
              <span className="text-lg font-bold text-foreground">Studious</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button className="md:hidden">
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-b from-secondary to-background relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Modern Learning
                <br />
              <span className="text-primary">Management Platform</span>
              </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Streamline your educational workflow with powerful tools for class management, assignments, and AI-powered insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-secondary px-8 py-6 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 rounded-xl overflow-hidden shadow-2xl border border-border relative">
            <img src="/hero-light.png" alt="Platform Dashboard" className="w-full h-auto block dark:hidden" />
            <img src="/hero-dark.png" alt="Platform Dashboard" className="w-full h-auto hidden dark:block" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-background -mt-16">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed for modern education
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-border hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Class Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organize classes, manage enrollment, and structure your curriculum efficiently.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create, distribute, and track assignments with automated grading support.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track student progress with detailed reports and performance insights.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Integrated scheduling with reminders and deadline management.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built-in messaging, announcements, and collaboration tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Leverage AI for content generation and personalized feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className="pt-12 pb-32 px-6 bg-background">
        <div className="container mx-auto max-w-6xl space-y-32">
          {/* Feature 1 - Smart Grading */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-primary font-semibold">
                <FileText className="h-5 w-5" />
                <span>Smart Grading</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Grade assignments in seconds, not hours.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Streamline your grading workflow with intuitive tools, 
                customizable rubrics, and consistent criteria across all submissions.
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-primary/10 p-8 border border-primary/20 shadow-2xl">
                <div className="bg-background rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Student Submission</span>
                    <Badge className="bg-primary/10 text-primary">Graded</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="h-3 bg-muted rounded w-4/6"></div>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <div className="flex-1 bg-primary/20 rounded-full h-2">
                      <div className="bg-primary rounded-full h-2 w-4/5"></div>
                    </div>
                    <span className="text-2xl font-bold text-primary">92%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 - Real-time Analytics */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1">
              <div className="rounded-2xl bg-primary/10 p-8 border border-primary/20 shadow-2xl">
                <div className="bg-background rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">Class Performance</span>
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted rounded-full h-8">
                        <div className="bg-primary rounded-full h-8 flex items-center justify-end pr-2" style={{width: '85%'}}>
                          <span className="text-xs font-semibold text-primary-foreground">85%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted rounded-full h-8">
                        <div className="bg-primary/70 rounded-full h-8 flex items-center justify-end pr-2" style={{width: '72%'}}>
                          <span className="text-xs font-semibold text-primary-foreground">72%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted rounded-full h-8">
                        <div className="bg-primary/50 rounded-full h-8 flex items-center justify-end pr-2" style={{width: '93%'}}>
                          <span className="text-xs font-semibold text-primary-foreground">93%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="inline-flex items-center gap-2 text-primary font-semibold">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Track progress, identify gaps.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Get real-time insights into student performance with detailed analytics. 
                Spot trends, identify struggling students, and adjust your teaching strategy.
              </p>
            </div>
          </div>

          {/* Feature 3 - Collaboration */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-primary font-semibold">
                <MessageCircle className="h-5 w-5" />
                <span>Communication</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Stay connected with your students.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Built-in messaging, announcements, and real-time notifications keep 
                everyone on the same page. Foster collaboration and engagement.
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-primary/10 p-8 border border-primary/20 shadow-2xl">
                <div className="bg-background rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-2 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-2 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-2 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Get Started?
            </h2>
          <p className="text-xl text-primary-foreground/90 mb-10">
            Join thousands of educators already using Studious to enhance their teaching experience.
            </p>
            
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
              <Button size="lg" className="bg-background text-primary hover:bg-background/90 px-8 py-6 text-lg">
                Join us now
                </Button>
              </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-secondary border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <img src="/logo.png" alt="Studious" className="w-6 h-6" />
              <span className="text-xl font-bold text-foreground">Studious</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-muted-foreground">
                &copy; 2025 Studious. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
      </div>
  );
}