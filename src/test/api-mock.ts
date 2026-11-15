import { vi } from "vitest";

export const apiMock = {
  app: {
    getAll: vi.fn(),
    getAllCategories: vi.fn(),
    getPingHistory: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    checkUpdates: vi.fn(),
    checkAppUpdates: vi.fn(),
  },
  notificationChannel: {
    getAll: vi.fn(),
    update: vi.fn(),
    test: vi.fn(),
  },
};
