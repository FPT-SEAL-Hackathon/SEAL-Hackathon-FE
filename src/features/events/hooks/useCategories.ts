import { useEffect, useState } from "react";
import { AssignMentorsRequest, Category, CategoryRequest, Mentor, CategoryMentor } from "../types/category";
import { categoryService } from "../service/categoryService";

export function useCategories(eventId: string) {
    const [categories, setCategories] = useState<Category[]>([]);
    
    //All mentors in the system
    const [availableMentors, setAvailableMentors] = useState<Mentor[]>([]);

    //Mentors assigned to Category
    const [categoryMentors, setCategoryMentors] = useState<Record<string, CategoryMentor[]>>({});

    const loadCategories = async () => {
        const data = await categoryService.getByEvent(eventId);
        setCategories(data);
    }

    const createCategory = async (body: CategoryRequest) => {
        const data = await categoryService.create(
            eventId,
            body
        );
        setCategories(prev => [...prev, data]);
    }

    const updateCategory = async(
        id: string,
        body: CategoryRequest
    ) => {
        const data = await categoryService.update(id, body);
        setCategories(prev => 
            prev.map(category => 
                category.categoryId === id ? data : category
            )
        );
    };

    const deleteCategory = async (id: string) => {
        await categoryService.delete(id);
        setCategories(prev => 
            prev.filter(category => category.categoryId !== id)
        );
    };

    //Category Mentor
    const loadCategoryMentors = async (categoryId: string) => {
        const data = await categoryService.getMentors(categoryId);
        
        setCategoryMentors(prev => ({
            ...prev,
            [categoryId]: data
        }));
    }

    const assignMentors = async (
        categoryId: string,
        body: AssignMentorsRequest
    ) => {
        await categoryService.assignMentor(categoryId, body);
        await loadCategoryMentors(categoryId);     
    }

    const removeMentor = async () => {};

    const loadAvailableMentors = async () => {
        const data = await categoryService.getAllMentors();
        setAvailableMentors(data);
    }

    useEffect(() => {
        loadCategories();
        loadAvailableMentors();
    }, [eventId]);

    useEffect(() => {
        categories.forEach(category => {
            loadCategoryMentors(category.categoryId);
        });
    }, [categories]);

    return {
        categories, 

        createCategory,
        updateCategory,
        deleteCategory,

        availableMentors,
        categoryMentors,

        loadAvailableMentors,
        assignMentors,
        removeMentor,
        loadCategoryMentors,
    };

}