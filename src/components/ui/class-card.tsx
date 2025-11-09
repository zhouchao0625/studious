
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  BookOpen, 
  Users, 
  Trash2,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RouterOutputs } from "@/lib/trpc";

type Assignment = RouterOutputs['assignment']['get']['assignments'];

interface ClassCardProps {
  id: string;
  title: string;
  section: string;
  subject: string;
  color: string;
  dueTodayAssignments: Assignment[];
  role: "teacher" | "student";
  onDelete?: () => void;
}

export function ClassCard({
  id,
  title,
  section,
  subject,
  color,
  dueTodayAssignments,
  role,
  onDelete
}: ClassCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-sm hover:scale-105 bg-card border-border">
      <Link href={`/class/${id}`}>
        {/* Image Preview */}
        <div className="relative h-28 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-br opacity-90"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${color}dd, ${color}aa), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" stroke-width="0.5" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>')` 
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white opacity-80" />
          </div>
          
          {/* Profile Pictures */}
          <div className="absolute bottom-2 left-2 flex -space-x-1">
            <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              <Users className="h-3 w-3 text-white" />
            </div>
            <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30"></div>
            <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30"></div>
          </div>
        </div>

        {/* Class Info */}
        <div className="p-3 space-y-1">
          <h3 className="font-medium text-sm leading-tight text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{subject}</p>
        </div>
      </Link>
      <div className="relative">
      {/* Menu - always visible */}
      <div className="absolute bottom-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-3">
              <MoreHorizontal className="h-3 w-3 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-[100] min-w-[120px]">
            {role === "teacher" && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/class/${id}/settings`} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/class/${id}/members`} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    Members
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Class
                </DropdownMenuItem>
              </>
            )}
            {role === "student" && (
              <DropdownMenuItem className="cursor-pointer">
                Leave Class
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}