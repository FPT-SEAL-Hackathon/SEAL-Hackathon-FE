export interface Category {
    categoryId: string;
    eventId: string;
    categoryName: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
}

export interface CategoryRequest {
    categoryName: string;
    description?: string;
    sortOrder?: number;
}

export interface CategoryMentor {
    categoryMentorId: string;
    categoryExpertId?: string;
    categoryId: string;
    mentorId: string;
    expertId?: string;
    fullName: string;
    email: string;
    assignedAt: string;
}

export interface Mentor {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role?: string;
    roleName?: string;
}

export interface AssignMentorsRequest {
    mentorIds?: string[];
    expertIds?: string[];
}
