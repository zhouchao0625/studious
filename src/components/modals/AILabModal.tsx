"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare } from "lucide-react";

interface AILabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labType: string;
  classId: string;
  onSubmit?: (data: { title: string; context: any }) => void;
  isLoading?: boolean;
}

export function AILabModal({ open, onOpenChange, labType, classId, onSubmit, isLoading }: AILabModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    gradeLevel: "",
    description: "",
    requirements: "",
    duration: ""
  });

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.subject && formData.gradeLevel && onSubmit) {
      // Create AI context object
      const context = {
        subject: formData.subject,
        topic: formData.title,
        difficulty: getDifficultyFromGrade(formData.gradeLevel),
        objectives: formData.requirements ? formData.requirements.split('\n').filter(Boolean) : [],
        persona: getPersonaFromType(labType),
        constraints: getConstraintsFromType(labType),
        metadata: {
          type: labType,
          gradeLevel: formData.gradeLevel,
          description: formData.description,
          duration: formData.duration
        }
      };

      // Call the onSubmit handler
      onSubmit({
        title: formData.title,
        context
      });
      
      // Reset form
      setFormData({
        title: "",
        subject: "",
        gradeLevel: "",
        description: "",
        requirements: "",
        duration: ""
      });
    }
  };

  const getDifficultyFromGrade = (gradeLevel: string): string => {
    const grade = parseInt(gradeLevel.split('-')[0]);
    if (grade <= 5) return 'beginner';
    if (grade <= 8) return 'intermediate';
    return 'advanced';
  };

  const getPersonaFromType = (type: string): string => {
    const personas = {
      assignment: 'helpful teaching assistant',
      quiz: 'encouraging quiz guide',
      worksheet: 'patient tutor',
      'lesson-plan': 'experienced educator',
      rubric: 'assessment expert'
    };
    return personas[type as keyof typeof personas] || 'supportive AI assistant';
  };

  const getConstraintsFromType = (type: string): string[] => {
    const constraints = {
      assignment: [
        'Provide guidance without giving direct answers',
        'Encourage critical thinking',
        'Ask clarifying questions'
      ],
      quiz: [
        'Give hints rather than answers',
        'Explain reasoning behind correct answers',
        'Encourage learning from mistakes'
      ],
      worksheet: [
        'Break down complex problems into steps',
        'Provide examples when helpful',
        'Celebrate progress and effort'
      ],
      'lesson-plan': [
        'Focus on pedagogical best practices',
        'Suggest engaging activities',
        'Consider different learning styles'
      ],
      rubric: [
        'Ensure clear assessment criteria',
        'Provide specific feedback examples',
        'Align with learning objectives'
      ]
    };
    return constraints[type as keyof typeof constraints] || ['Be helpful and supportive'];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create {labType}
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </DialogTitle>
          <p className="text-muted-foreground">
            Provide some basic information to help our AI create better content for you.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder={`Enter ${labType} title`}
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => handleFormChange("subject", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="geography">Geography</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level *</Label>
              <Select 
                value={formData.gradeLevel} 
                onValueChange={(value) => handleFormChange("gradeLevel", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="k-2">K-2</SelectItem>
                  <SelectItem value="3-5">3-5</SelectItem>
                  <SelectItem value="6-8">6-8</SelectItem>
                  <SelectItem value="9-12">9-12</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select 
                value={formData.duration} 
                onValueChange={(value) => handleFormChange("duration", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15-min">15 minutes</SelectItem>
                  <SelectItem value="30-min">30 minutes</SelectItem>
                  <SelectItem value="45-min">45 minutes</SelectItem>
                  <SelectItem value="1-hour">1 hour</SelectItem>
                  <SelectItem value="90-min">90 minutes</SelectItem>
                  <SelectItem value="2-hours">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={`Describe what this ${labType} should cover...`}
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requirements">Special Requirements</Label>
            <Textarea
              id="requirements"
              placeholder="Any specific requirements, learning objectives, or constraints..."
              value={formData.requirements}
              onChange={(e) => handleFormChange("requirements", e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={!formData.title || !formData.subject || !formData.gradeLevel || isLoading}
            >
              {isLoading ? 'Creating Lab...' : 'Create AI Lab'}
              <MessageSquare className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
