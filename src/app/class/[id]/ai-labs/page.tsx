// "use client";

// import { useParams } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Sparkles, Wand2, BookOpen, Users, Target } from "lucide-react";
// import { ContentGenerationForm } from "@/components/ai-labs/ContentGenerationForm";
// import { trpc } from "@/lib/trpc";

// interface ClassStats {
//   totalStudents: number;
//   totalAssignments: number;
//   avgGrade: number;
// }

// export default function ClassAILabs() {
//   const { id: classId } = useParams();
//   const { data: classData } = trpc.class.get.useQuery({ classId: classId as string });

//   // Mock class stats - in real app this would come from API
//   const classStats: ClassStats = {
//     totalStudents: 28,
//     totalAssignments: 12,
//     avgGrade: 85.4
//   };

//   return (
//     <div className="container mx-auto p-6 max-w-6xl">
//       {/* Header */}
//       <div className="mb-8">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
//             <Wand2 className="h-7 w-7 text-white" />
//           </div>
//           <div className="flex-1">
//             <h1 className="text-3xl font-bold text-foreground">Content Generation Studio</h1>
//             <p className="text-muted-foreground mt-1">
//               Create professional educational materials with AI assistance
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             {classData?.class && (
//               <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
//                 <BookOpen className="h-3 w-3 mr-1" />
//                 {classData.class.name}
//               </Badge>
//             )}
//             <Badge className="bg-purple-100 text-purple-700 px-3 py-1">
//               AI Powered
//             </Badge>
//           </div>
//         </div>

//         {/* Class Overview Cards */}
//         {classData?.class && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <Card>
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-blue-100 rounded-lg">
//                     <Users className="h-5 w-5 text-blue-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-muted-foreground">Students</p>
//                     <p className="text-xl font-semibold">{classStats.totalStudents}</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
            
//             <Card>
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-green-100 rounded-lg">
//                     <Target className="h-5 w-5 text-green-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-muted-foreground">Assignments</p>
//                     <p className="text-xl font-semibold">{classStats.totalAssignments}</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
            
//             <Card>
//               <CardContent className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-orange-100 rounded-lg">
//                     <Sparkles className="h-5 w-5 text-orange-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-muted-foreground">Avg Grade</p>
//                     <p className="text-xl font-semibold">{classStats.avgGrade}%</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}
//       </div>

//       {/* Content Generation Form */}
//       {/* <ContentGenerationForm 
//         classData={classData?.class ? {
//           name: classData.class.name,
//           subject: classData.class.subject,
//           grade: classData.class.grade
//         } : undefined}
//       /> */}
//     </div>
//   );
// }

export default function ClassAILabs() {
  return (
    <div>
      <h1>Class AI Labs</h1>
    </div>
  );
}
