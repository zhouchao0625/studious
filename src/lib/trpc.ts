import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@studious-lms/server';
import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';

export const trpc = createTRPCReact<AppRouter>(); 
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

// ===== AUTHENTICATION TYPES =====
export type AuthRegisterInput = RouterInputs['auth']['register'];
export type AuthLoginInput = RouterInputs['auth']['login'];
export type AuthRegisterOutput = RouterOutputs['auth']['register'];
export type AuthLoginOutput = RouterOutputs['auth']['login'];
export type AuthCheckOutput = RouterOutputs['auth']['check'];

// ===== USER TYPES =====
export type UserGetProfileOutput = RouterOutputs['user']['getProfile'];
export type UserUpdateProfileInput = RouterInputs['user']['updateProfile'];
export type UserGetUploadUrlInput = RouterInputs['user']['getUploadUrl'];
export type UserGetUploadUrlOutput = RouterOutputs['user']['getUploadUrl'];

// ===== CLASS TYPES =====
export type ClassGetAllOutput = RouterOutputs['class']['getAll'];
export type ClassGetOutput = RouterOutputs['class']['get'];
export type ClassCreateInput = RouterInputs['class']['create'];
export type ClassUpdateInput = RouterInputs['class']['update'];
export type ClassJoinInput = RouterInputs['class']['join'];
export type ClassGetInviteCodeOutput = RouterOutputs['class']['getInviteCode'];
export type ClassChangeRoleInput = RouterInputs['class']['changeRole'];
export type ClassGetGradesOutput = RouterOutputs['class']['getGrades'];
export type ClassGetSyllabusOutput = RouterOutputs['class']['getSyllabus'];
export type ClassGetFilesOutput = RouterOutputs['class']['getFiles'];
export type ClassListMarkSchemesOutput = RouterOutputs['class']['listMarkSchemes'];
export type ClassCreateMarkSchemeInput = RouterInputs['class']['createMarkScheme'];
export type ClassUpdateMarkSchemeInput = RouterInputs['class']['updateMarkScheme'];
export type ClassDeleteMarkSchemeInput = RouterInputs['class']['deleteMarkScheme'];
export type ClassListGradingBoundariesOutput = RouterOutputs['class']['listGradingBoundaries'];
export type ClassCreateGradingBoundaryInput = RouterInputs['class']['createGradingBoundary'];
export type ClassUpdateGradingBoundaryInput = RouterInputs['class']['updateGradingBoundary'];
export type ClassDeleteGradingBoundaryInput = RouterInputs['class']['deleteGradingBoundary'];

// ===== ASSIGNMENT TYPES =====
export type AssignmentCreateInput = RouterInputs['assignment']['create'];
export type AssignmentUpdateInput = RouterInputs['assignment']['update'];
export type AssignmentGetOutput = RouterOutputs['assignment']['get'];
export type AssignmentGetSubmissionOutput = RouterOutputs['assignment']['getSubmission'];
export type AssignmentGetSubmissionsOutput = RouterOutputs['assignment']['getSubmissions'];
export type AssignmentUpdateSubmissionInput = RouterInputs['assignment']['updateSubmission'];
export type AssignmentUpdateSubmissionAsTeacherInput = RouterInputs['assignment']['updateSubmissionAsTeacher'];

// ===== ANNOUNCEMENT TYPES =====
export type AnnouncementGetAllOutput = RouterOutputs['announcement']['getAll'];
export type AnnouncementCreateInput = RouterInputs['announcement']['create'];
export type AnnouncementUpdateInput = RouterInputs['announcement']['update'];

// ===== FILE TYPES =====
export type FileGetSignedUrlOutput = RouterOutputs['file']['getSignedUrl'];

// ===== NOTIFICATION TYPES =====
export type NotificationListOutput = RouterOutputs['notification']['list'];
export type NotificationGetOutput = RouterOutputs['notification']['get'];
export type NotificationSendToInput = RouterInputs['notification']['sendTo'];
export type NotificationSendToMultipleInput = RouterInputs['notification']['sendToMultiple'];