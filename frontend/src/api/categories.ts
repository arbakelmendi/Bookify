import { apiGet, apiPost, apiPut, apiDelete } from "@/api/client";

export type CategoryDto = { id: number; name: string };

export const getCategories = () => apiGet<CategoryDto[]>("/api/categories");
export const createCategory = (name: string) =>
  apiPost<CategoryDto>("/api/categories", { name });
export const updateCategory = (id: number, name: string) =>
  apiPut<CategoryDto>(`/api/categories/${id}`, { name });
export const deleteCategory = (id: number) => apiDelete<void>(`/api/categories/${id}`);
