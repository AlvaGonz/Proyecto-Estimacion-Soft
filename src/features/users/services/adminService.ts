import { UserRole, User as AppUser, Round, Task, Project } from '../../../types';
import { fetchApi } from '../../../shared/api';

export interface AdminUser {
    id?: string;
    _id?: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin?: string;
}

export const adminService = {
   /**
    * List all users with optional filters
    * RF003: Gestión de usuarios
    */
   async listUsers(filters: { role?: string; isActive?: boolean } = {}): Promise<{ users: AdminUser[] }> {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const result = await fetchApi<{ users: AdminUser[] }>(`/admin/users?${params.toString()}`);
      return result || { users: [] };
   },

   /**
    * Create a new user manually
    * RF003: Gestión de usuarios
    */
   async createUser(userData: any): Promise<AdminUser> {
      const result = await fetchApi<AdminUser>('/admin/users', {
         method: 'POST',
         body: JSON.stringify(userData)
      });
      return result;
   },

   /**
    * Deactivate a user account
    * RF003: Gestión de usuarios
    */
   async deactivateUser(id: string): Promise<void> {
      await fetchApi<void>(`/admin/users/${id}/deactivate`, {
         method: 'PATCH'
      });
   },

   /**
    * List all projects for administrative oversight
    */
   async listProjects(): Promise<any[]> {
      const result = await fetchApi<any>('/admin/projects');
      return result.projects || result;
   },

   /**
    * Restore a deleted project
    */
   async restoreProject(id: string): Promise<void> {
      await fetchApi(`/admin/projects/${id}/restore`, {
         method: 'POST'
      });
   }
};
