/**
 * Standardized query key patterns for multi-company setup
 * Use these functions to ensure consistent, company-specific query keys
 */

export const QueryKeys = {
  // Company-specific resource patterns
  company: (companyId: string) => ['company', companyId] as const,
  companyFeatures: (companyId: string) => ['company-features', companyId] as const,
  
  // User & Profile patterns
  userProfile: (userId: string, companyId: string) => ['userProfile', userId, companyId] as const,
  userProfileForCompany: (userId: string, companyId: string) => ['userProfileForCompany', userId, companyId] as const,
  userCustomProfileData: (userId: string, companyId: string) => ['user-custom-profile-data', userId, companyId] as const,
  
  // Spaces patterns
  spaces: (companyId: string, categoryId?: string) => 
    categoryId ? ['spaces', companyId, categoryId] : ['spaces', companyId] as const,
  userSpaces: (companyId: string, categoryId?: string) => 
    categoryId ? ['userSpaces', companyId, categoryId] : ['userSpaces', companyId] as const,
  spaceCategories: (companyId: string) => ['spaceCategories', companyId] as const,
  
  // Posts patterns
  posts: (companyId: string, spaceId?: string) => 
    spaceId ? ['posts', companyId, spaceId] : ['posts', companyId] as const,
  
  // Courses patterns
  courses: (companyId: string) => ['courses', companyId] as const,
  courseModules: (companyId: string, courseId?: string) => 
    courseId ? ['course-modules', courseId, companyId] : ['course-modules', companyId] as const,
  courseLessons: (companyId: string, moduleId?: string) => 
    moduleId ? ['course-lessons', moduleId, companyId] : ['course-lessons', companyId] as const,
  userCourseAccess: (companyId: string) => ['user-course-access', companyId] as const,
  
  // Access control patterns
  accessGroups: (companyId: string) => ['access-groups', companyId] as const,
  accessGroupMembers: (companyId: string, accessGroupId: string) => 
    ['access-group-members', accessGroupId, companyId] as const,
  accessGroupCourses: (companyId: string, accessGroupId: string) => 
    ['access-group-courses', accessGroupId, companyId] as const,
  accessGroupSpaces: (companyId: string, accessGroupId: string) => 
    ['access-group-spaces', accessGroupId, companyId] as const,
  
  // Management patterns
  segments: (companyId: string) => ['segments', companyId] as const,
  tags: (companyId: string) => ['tags', companyId] as const,
  userTags: (companyId: string, userId?: string) => 
    userId ? ['user-tags', userId, companyId] : ['user-tags', companyId] as const,
  
  // Events patterns  
  events: (companyId: string) => ['events', companyId] as const,
  allUserEvents: (companyId: string) => ['allUserEvents', companyId] as const,
  eventMaterials: (companyId: string, eventId: string) => 
    ['eventMaterials', eventId, companyId] as const,
  
  // Challenges patterns
  challenges: (companyId: string) => ['challenges', companyId] as const,
  challengeParticipations: (companyId: string) => ['challenge-participations', companyId] as const,
  challengeSubmissions: (companyId: string) => ['challenge-submissions', companyId] as const,
  adminChallengeSubmissions: (companyId: string) => ['admin-challenge-submissions', companyId] as const,
  
  // Notifications patterns
  notifications: (companyId: string) => ['notifications', companyId] as const,
  userAnnouncements: (companyId: string, userId?: string) => 
    userId ? ['user-announcements', userId, companyId] : ['user-announcements', companyId] as const,
  
  // Admin patterns
  bulkActions: (companyId: string) => ['bulk-actions', companyId] as const,
  bulkActionExecutions: (companyId: string) => ['bulk-action-executions', companyId] as const,
  bannedWords: (companyId: string) => ['bannedWords', companyId] as const,
  bugReports: (companyId: string) => ['bug-reports', companyId] as const,
  
  // Financial patterns
  paymentProviderConfig: (companyId: string) => ['paymentProviderConfig', companyId] as const,
  
  // Configuration patterns
  whatsappConfig: (companyId: string) => ['whatsapp-config', companyId] as const,
  customProfileFields: (companyId: string) => ['custom-profile-fields', companyId] as const,
  companyLevels: (companyId: string) => ['companyLevels', companyId] as const,
  
} as const;

/**
 * Helper function to validate if a query key follows the company-specific pattern
 */
export const isCompanySpecificQuery = (queryKey: unknown[]): boolean => {
  if (!Array.isArray(queryKey) || queryKey.length < 2) {
    return false;
  }
  
  // Second element should be a company ID (UUID format)
  const companyId = queryKey[1];
  return typeof companyId === 'string' && 
         companyId.length === 36 && 
         companyId.includes('-');
};

/**
 * Helper function to extract company ID from a query key
 */
export const getCompanyIdFromQueryKey = (queryKey: unknown[]): string | null => {
  if (isCompanySpecificQuery(queryKey)) {
    return queryKey[1] as string;
  }
  return null;
};

/**
 * Legacy query keys that should be migrated to company-specific patterns
 */
export const LEGACY_QUERY_KEYS = [
  'company',
  'spaces', 
  'userSpaces',
  'spaceCategories',
  'posts',
  'courses',
  'userProfile',
  'access-groups',
  'segments',
  'events',
  'challenges',
  'notifications',
  'bulk-actions',
  'bannedWords'
] as const;