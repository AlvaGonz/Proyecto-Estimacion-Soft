import { APIRequestContext } from '@playwright/test';

/**
 * api.helper.ts
 * Wrapper tipado para las llamadas REST al backend durante el setup y validación E2E.
 */
export class APIHelper {
  constructor(private request: APIRequestContext) {}

  /**
   * Realiza login y devuelve la cookie de sesión cruda.
   */
  async login(email: string, password: string): Promise<string> {
    const res = await this.request.post('auth/login', {
      data: { email, password }
    });

    if (!res.ok()) {
      throw new Error(`[APIHelper] Login falló para ${email}: ${res.status()} ${await res.text()}`);
    }

    const setCookie = res.headers()['set-cookie'] ?? '';
    return setCookie
      .split(/,(?=[^ ])|[\r\n]+/)
      .map(c => c.trim().split(';')[0])
      .filter(Boolean)
      .join('; ');
  }

  /**
   * Crea un nuevo proyecto y devuelve su ID.
   */
  async createProject(cookie: string, payload: CreateProjectDTO): Promise<string> {
    const res = await this.request.post('projects', {
      headers: { Cookie: cookie },
      data: payload
    });

    if (!res.ok()) {
      throw new Error(`[APIHelper] Error al crear proyecto: ${res.status()} ${await res.text()}`);
    }

    const body = await res.json();
    return body.data?._id || body.data?.id;
  }

  /**
   * Abre una nueva ronda para un proyecto.
   */
  async openRound(cookie: string, projectId: string): Promise<string> {
    const res = await this.request.post(`projects/${projectId}/rounds`, {
      headers: { Cookie: cookie }
    });

    if (!res.ok()) {
      throw new Error(`[APIHelper] Error al abrir ronda: ${res.status()} ${await res.text()}`);
    }

    const body = await res.json();
    return body.data?._id || body.data?.id;
  }

  /**
   * Cierra una ronda específica.
   */
  async closeRound(cookie: string, projectId: string, roundId: string): Promise<void> {
    const res = await this.request.patch(`projects/${projectId}/rounds/${roundId}/close`, {
      headers: { Cookie: cookie }
    });

    if (!res.ok()) {
      throw new Error(`[APIHelper] Error al cerrar ronda: ${res.status()} ${await res.text()}`);
    }
  }

  /**
   * Elimina un proyecto por ID.
   */
  async deleteProjectById(cookie: string, projectId: string): Promise<void> {
    const res = await this.request.delete(`projects/${projectId}`, {
      headers: { Cookie: cookie }
    });

    if (!res.ok()) {
      throw new Error(`[APIHelper] Error al eliminar proyecto: ${res.status()} ${await res.text()}`);
    }
  }
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  metodoEstimacion: 'Delphi' | 'Poker' | 'TresPuntos';
  unidadMedida: string;
}
