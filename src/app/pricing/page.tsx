"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Menu } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for individuals and special cases",
      features: ["Up to 3 classes", "Basic assignments", "File sharing", "Email support", "Community access"],
      popular: false
    },
    {
      name: "Teacher",
      price: "$9",
      period: "per month",
      description: "Best for individual educators",
      features: ["Unlimited classes", "Advanced grading", "Analytics", "Priority support", "AI-powered tools"],
      popular: true
    },
    {
      name: "School",
      price: "$49",
      period: "per month",
      description: "Designed for institutions",
      features: ["Everything in Teacher", "School management", "Bulk user import", "Custom domain", "Dedicated support"],
      popular: false
    }
  ];

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
              <Link href="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8 py-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground">Start free, upgrade as you grow</p>
          </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? "border-primary" : ""}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.period}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}