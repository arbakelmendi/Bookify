import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";

export type NewsletterEmailDto = {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export function subscribeNewsletter(email: string) {
  return apiPost<NewsletterEmailDto>("/api/newsletter/subscribe", { email });
}

export function getAdminNewsletterEmails() {
  return apiGet<NewsletterEmailDto[]>("/api/admin/newsletter");
}

export function createAdminNewsletterEmail(email: string) {
  return apiPost<NewsletterEmailDto>("/api/admin/newsletter", { email });
}

export function updateAdminNewsletterEmail(id: number, email: string) {
  return apiPut<NewsletterEmailDto>(`/api/admin/newsletter/${id}`, { email });
}

export function deleteAdminNewsletterEmail(id: number) {
  return apiDelete<void>(`/api/admin/newsletter/${id}`);
}

