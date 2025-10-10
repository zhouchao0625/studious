import { useDrag } from "react-dnd";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Paperclip,
  GripVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RouterOutputs } from "@/lib/trpc";
interface DraggableAssignmentProps {
  assignment: RouterOutputs['assignment']['get'];
  classId: string;
  index?: number;
  onDelete?: (assignmentId: string) => void;
  onPublish?: (assignmentId: string) => void;
  isTeacher?: boolean;
}

export function DraggableAssignment({ assignment, classId, index, onDelete, onPublish, isTeacher }: DraggableAssignmentProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "assignment",
    item: { id: assignment.id, type: "assignment", index },
    canDrag: isTeacher,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };



  console.log(assignment);
  const totalStudents = assignment.submissions ? assignment.submissions.length : 0;

  const totalSubmissions = assignment.submissions ? assignment.submissions.filter(submission => submission.submitted).length : 0;

  return (
    <div ref={isTeacher ? drag as unknown as React.Ref<HTMLDivElement> : null} className={`transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
      <Card className={`hover:shadow-md transition-all duration-200 border-l-4 border-l-primary group ${isTeacher ? 'cursor-move' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {isTeacher && (
                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <Link 
                    href={`/class/${classId}/assignment/${assignment.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {assignment.title}
                  </Link>
                  {assignment.inProgress && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Draft
                    </Badge>
                  )}
                  <Badge className={getStatusColor(assignment.status)}>
                    {assignment.status}
                  </Badge>
                  {assignment.hasAttachments && (
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {assignment.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{assignment.type}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due {formatDate(assignment.dueDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{assignment.dueTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>{assignment.points} points</span>
                  </div>
                </div>

                {isTeacher && (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">
                      <strong>{totalSubmissions}</strong> of <strong>{totalStudents}</strong> submitted
                    </span>
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(totalSubmissions / totalStudents) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              {assignment.inProgress && isTeacher && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => onPublish?.(assignment.id)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Publish
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/class/${classId}/assignment/${assignment.id}`}>
                  View Details
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Assignment
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    View Submissions
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Export Grades
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onDelete?.(assignment.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}