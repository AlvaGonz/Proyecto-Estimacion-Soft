import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminPanel } from './useAdminPanel';
import { adminService } from '../services/adminService';

// Mock de servicios completos
vi.mock('../services/adminService', () => ({
  adminService: {
    listUsers: vi.fn(),
    listProjects: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('../../../features/projects/services/projectService', () => ({
  projectService: {
    deleteProject: vi.fn(),
  }
}));

vi.mock('../../../features/notifications/services/notificationService', () => ({
  notificationService: {
    addNotification: vi.fn(),
  }
}));

vi.mock('../../../features/tasks/services/taskService', () => ({
  taskService: {
    getTasks: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('../../../features/rounds/services/roundService', () => ({
  roundService: {
    getRoundsByTask: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('../../../shared/components/ModalProvider', () => ({
  useModal: () => ({ confirm: vi.fn() })
}));

describe('useAdminPanel - Role Filter Server-Side Validation', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    (adminService.listUsers as any).mockResolvedValue({ users: [], total: 0, page: 1, pages: 1 });
  });

  it('TEST CA-S1a — Filtro "Todos" (roleFilter vacío): payload excluye role', async () => {
    const { result } = renderHook(() => useAdminPanel());
    
    // El valor por defecto de roleFilter es '' y showInactive es false
    expect(result.current.roleFilter).toBe('');
    expect(result.current.showInactive).toBe(false);

    await waitFor(() => {
      expect(adminService.listUsers).toHaveBeenCalledWith({ isActive: true });
    });
    // role no debe estar en el payload cuando es vacío
    const lastCall = vi.mocked(adminService.listUsers).mock.calls[0][0];
    expect(lastCall).not.toHaveProperty('role');
  });

  it('TEST CA-S1b — Filtro "admin": payload incluye role y isActive', async () => {
    const { result } = renderHook(() => useAdminPanel());
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalled());

    act(() => {
      result.current.setRoleFilter('admin');
    });

    await waitFor(() => {
      // 2 llamadas: al montar y tras el cambo del filtro
      expect(adminService.listUsers).toHaveBeenCalledTimes(2);
      expect(adminService.listUsers).toHaveBeenLastCalledWith({ role: 'admin', isActive: true });
    });
  });

  it('TEST CA-S1c — Filtro "facilitador": payload incluye role y isActive', async () => {
    const { result } = renderHook(() => useAdminPanel());
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalled());

    act(() => {
      result.current.setRoleFilter('facilitador');
    });

    await waitFor(() => {
      expect(adminService.listUsers).toHaveBeenLastCalledWith({ role: 'facilitador', isActive: true });
    });
  });

  it('TEST CA-S1d — Filtro "experto": payload incluye role y isActive', async () => {
    const { result } = renderHook(() => useAdminPanel());
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalled());

    act(() => {
      result.current.setRoleFilter('experto');
    });

    await waitFor(() => {
      expect(adminService.listUsers).toHaveBeenLastCalledWith({ role: 'experto', isActive: true });
    });
  });

  it('TEST CA-S1e — Filtro inventado "Product Owner" que no est\u00e1 en el tipo pero para simularlo: payload lo incluye', async () => {
    // Si bien no es un rol en types, el comportamiento del request builder es lo que probamos
    const { result } = renderHook(() => useAdminPanel());
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalled());

    act(() => {
      result.current.setRoleFilter('Product Owner');
    });

    await waitFor(() => {
      expect(adminService.listUsers).toHaveBeenLastCalledWith({ role: 'Product Owner', isActive: true });
    });
  });

  it('TEST CA-S2a \u2014 showInactive = true con filtro activo excluye isActive', async () => {
    const { result } = renderHook(() => useAdminPanel());
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalled());

    act(() => {
      result.current.setRoleFilter('experto');
      result.current.setShowInactive(true);
    });

    await waitFor(() => {
      // Debería enviarse sin isActive pero con el de rol
      expect(adminService.listUsers).toHaveBeenLastCalledWith({ role: 'experto' });
      const lastCall = vi.mocked(adminService.listUsers).mock.calls[vi.mocked(adminService.listUsers).mock.calls.length - 1][0];
      expect(lastCall).not.toHaveProperty('isActive');
    });
  });

  it('TEST CA-S2b \u2014 showInactive = true sin filtro de rol env\u00eda payload vac\u00edo', async () => {
    const { result } = renderHook(() => useAdminPanel());
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalled());

    act(() => {
      result.current.setShowInactive(true);
    });

    await waitFor(() => {
      // Debería enviarse sin role y sin isActive
      expect(adminService.listUsers).toHaveBeenLastCalledWith({});
    });
  });

  it('TEST CA-S3 \u2014 Respuesta del servidor actualiza la lista', async () => {
    const mockUsers = [{ id: '1', name: 'Ana', role: 'admin', isActive: true, email: 'ana@example.com' }];
    (adminService.listUsers as any).mockResolvedValueOnce({ users: mockUsers, total: 1, page: 1, pages: 1 });
    
    const { result } = renderHook(() => useAdminPanel());

    await waitFor(() => {
      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('TEST CA-S4 \u2014 Error del servidor es manejado', async () => {
    const mockUsers = [{ id: '1', name: 'Ana', role: 'admin', isActive: true, email: 'ana@example.com' }];
    (adminService.listUsers as any)
      .mockResolvedValueOnce({ users: mockUsers, total: 1, page: 1, pages: 1 })
      .mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useAdminPanel());
    await waitFor(() => expect(result.current.users).toEqual(mockUsers));

    act(() => {
      result.current.setRoleFilter('facilitador');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Network Error');
      expect(result.current.users).toEqual(mockUsers); // La lista se mantiene
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('TEST CA-S5 \u2014 loadUsers se re-ejecuta al cambiar roleFilter', async () => {
    const { result } = renderHook(() => useAdminPanel());
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setRoleFilter('admin');
    });

    await waitFor(() => {
      expect(adminService.listUsers).toHaveBeenCalledTimes(2);
      expect(adminService.listUsers).toHaveBeenLastCalledWith({ role: 'admin', isActive: true });
    });
  });

});
