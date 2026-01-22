const API_URL = '/api';

// TypeScript Interfaces

interface Admin {
  id: number;
  username: string;
}

interface Category {
  id: number;
  name: string;
  display_order: number;
}

interface CategoryWithNominees extends Category {
  nominees: Nominee[];
  winner_id: number | null;
}

interface Nominee {
  id: number;
  category_id: number;
  name: string;
  is_winner: boolean;
}

interface Lobby {
  id: string;
  admin_id: number;
  name: string;
  status: 'open' | 'locked' | 'completed';
  created_at: string;
  locked_at: string | null;
  participant_count?: number;
}

interface Participant {
  id: number;
  lobby_id: string;
  name: string;
  submitted_at: string;
}

interface LeaderboardEntry {
  participantId: number;
  name: string;
  score: number;
  correctPicks: number;
  totalPicks: number;
  rank: number;
}

interface ParticipantPick {
  categoryId: number;
  categoryName: string;
  nomineeId: number;
  nomineeName: string;
  winnerId: number | null;
  winnerName: string | null;
  isCorrect: boolean | null;
}

// API Client

export const api = {
  auth: {
    register: async (username: string, password: string): Promise<Admin> => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Registration failed');
      }
      return res.json();
    },

    login: async (username: string, password: string): Promise<Admin> => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Login failed');
      }
      return res.json();
    },

    logout: async (): Promise<void> => {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    },

    me: async (): Promise<Admin> => {
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    },
  },

  category: {
    getAll: async (): Promise<CategoryWithNominees[]> => {
      const res = await fetch(`${API_URL}/category`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to get categories');
      return res.json();
    },

    create: async (name: string): Promise<Category> => {
      const res = await fetch(`${API_URL}/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create category');
      }
      return res.json();
    },

    update: async (id: number, name: string, displayOrder?: number): Promise<Category> => {
      const res = await fetch(`${API_URL}/category/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, displayOrder }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update category');
      }
      return res.json();
    },

    delete: async (id: number): Promise<void> => {
      const res = await fetch(`${API_URL}/category/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete category');
      }
    },

    reorder: async (orderedIds: number[]): Promise<CategoryWithNominees[]> => {
      const res = await fetch(`${API_URL}/category/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reorder categories');
      }
      return res.json();
    },

    addNominee: async (categoryId: number, name: string): Promise<Nominee> => {
      const res = await fetch(`${API_URL}/category/${categoryId}/nominees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add nominee');
      }
      return res.json();
    },

    deleteNominee: async (categoryId: number, nomineeId: number): Promise<void> => {
      const res = await fetch(`${API_URL}/category/${categoryId}/nominees/${nomineeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete nominee');
      }
    },

    setWinner: async (categoryId: number, nomineeId: number): Promise<void> => {
      const res = await fetch(`${API_URL}/category/${categoryId}/nominees/${nomineeId}/winner`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to set winner');
      }
    },

    clearWinner: async (categoryId: number): Promise<void> => {
      const res = await fetch(`${API_URL}/category/${categoryId}/winner`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to clear winner');
      }
    },
  },

  // Lobby methods will be added in Phase 4
  lobby: {},

  // Participant methods will be added in Phase 5
  participant: {},

  // Leaderboard methods will be added in Phase 6
  leaderboard: {},
};

export type {
  Admin,
  Category,
  CategoryWithNominees,
  Nominee,
  Lobby,
  Participant,
  LeaderboardEntry,
  ParticipantPick,
};
