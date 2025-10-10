import { PageLayout, PageHeader } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FlaskConical, 
  Clock, 
  Users,
  FileText
} from "lucide-react";

const mockLabs = [
  {
    id: "1",
    title: "Optics Lab: Refraction and Reflection",
    description: "Investigate the behavior of light through different mediums",
    status: "active",
    dueDate: "2024-01-20",
    assignedStudents: 24,
    completedStudents: 18,
    duration: "2 hours",
    equipment: ["Laser pointer", "Glass prisms", "Protractor", "White screen"]
  },
  {
    id: "2",
    title: "Electric Circuits Lab",
    description: "Build and analyze simple DC circuits",
    status: "draft",
    dueDate: "2024-01-25",
    assignedStudents: 0,
    completedStudents: 0,
    duration: "1.5 hours",
    equipment: ["Breadboard", "Resistors", "LEDs", "Multimeter"]
  },
  {
    id: "3",
    title: "Pendulum Motion Analysis",
    description: "Study periodic motion and calculate gravitational acceleration",
    status: "completed",
    dueDate: "2024-01-10",
    assignedStudents: 24,
    completedStudents: 24,
    duration: "1 hour",
    equipment: ["Pendulum setup", "Stopwatch", "Ruler", "Calculator"]
  }
];

export default function Labs() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-accent text-accent-foreground";
      case "draft": return "bg-warning text-warning-foreground";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Labs"
        description="Manage laboratory exercises and experiments"
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Lab
        </Button>
      </PageHeader>

      {/* Labs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Labs</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockLabs.filter(lab => lab.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Labs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockLabs.filter(lab => lab.status === "draft").length}
            </div>
            <p className="text-xs text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Labs List */}
      <div className="space-y-6">
        {mockLabs.map((lab) => (
          <Card key={lab.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold">{lab.title}</h3>
                    <Badge className={getStatusColor(lab.status)}>
                      {lab.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{lab.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{lab.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{lab.assignedStudents} students</span>
                    </div>
                    <div>
                      Due: {new Date(lab.dueDate).toLocaleDateString()}
                    </div>
                  </div>

                  {lab.status === "active" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion Progress</span>
                        <span>{getCompletionPercentage(lab.completedStudents, lab.assignedStudents)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-accent h-2 rounded-full transition-all"
                          style={{ width: `${getCompletionPercentage(lab.completedStudents, lab.assignedStudents)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2">Required Equipment:</h4>
                    <div className="flex flex-wrap gap-2">
                      {lab.equipment.map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  {lab.status === "draft" ? (
                    <>
                      <Button size="sm">
                        Publish Lab
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit Draft
                      </Button>
                    </>
                  ) : lab.status === "active" ? (
                    <>
                      <Button size="sm">
                        View Results
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit Lab
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                      <Button variant="outline" size="sm">
                        Archive
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockLabs.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No labs created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first lab exercise to get students hands-on experience
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Lab
            </Button>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}