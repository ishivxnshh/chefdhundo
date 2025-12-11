import { create } from 'zustand';
import { Announcement, AnnouncementInsert, AnnouncementUpdate } from '@/types/announcement';

interface AnnouncementState {
  // State
  announcements: Announcement[];
  activeAnnouncements: Announcement[];
  currentAnnouncement: Announcement | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAllAnnouncements: () => Promise<void>;
  fetchActiveAnnouncements: () => Promise<void>;
  createAnnouncement: (data: AnnouncementInsert) => Promise<void>;
  updateAnnouncement: (id: string, updates: AnnouncementUpdate) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  setCurrentAnnouncement: (announcement: Announcement | null) => void;
  clearError: () => void;
}

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
  // Initial state
  announcements: [],
  activeAnnouncements: [],
  currentAnnouncement: null,
  isLoading: false,
  error: null,

  // Fetch all announcements (admin view)
  fetchAllAnnouncements: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/announcements');
      const result = await response.json();

      if (result.success && result.data) {
        set({
          announcements: result.data,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          announcements: [],
          isLoading: false,
          error: result.error || 'Failed to fetch announcements',
        });
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      set({
        announcements: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Fetch only active announcements (public view)
  fetchActiveAnnouncements: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/announcements?active=true');
      const result = await response.json();
      
      console.log('Fetched active announcements:', result);

      if (result.success && result.data) {
        console.log('Active announcements data:', result.data);
        set({
          activeAnnouncements: result.data,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          activeAnnouncements: [],
          isLoading: false,
          error: result.error || 'Failed to fetch active announcements',
        });
      }
    } catch (error) {
      console.error('Error fetching active announcements:', error);
      set({
        activeAnnouncements: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Create new announcement
  createAnnouncement: async (data: AnnouncementInsert) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        set((state) => ({
          announcements: [result.data, ...state.announcements],
          currentAnnouncement: result.data,
          isLoading: false,
          error: null,
        }));
      } else {
        set({
          isLoading: false,
          error: result.error || 'Failed to create announcement',
        });
        throw new Error(result.error || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Update announcement
  updateAnnouncement: async (id: string, updates: AnnouncementUpdate) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        set((state) => ({
          announcements: state.announcements.map((ann) =>
            ann.id === id ? result.data : ann
          ),
          currentAnnouncement: result.data,
          isLoading: false,
          error: null,
        }));
      } else {
        set({
          isLoading: false,
          error: result.error || 'Failed to update announcement',
        });
        throw new Error(result.error || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Delete announcement
  deleteAnnouncement: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        set((state) => ({
          announcements: state.announcements.filter((ann) => ann.id !== id),
          currentAnnouncement: null,
          isLoading: false,
          error: null,
        }));
      } else {
        set({
          isLoading: false,
          error: result.error || 'Failed to delete announcement',
        });
        throw new Error(result.error || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Set current announcement
  setCurrentAnnouncement: (announcement: Announcement | null) => {
    set({ currentAnnouncement: announcement });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

// Selector hooks for easier usage
export const useAnnouncements = () =>
  useAnnouncementStore((state) => state.announcements);
export const useActiveAnnouncements = () =>
  useAnnouncementStore((state) => state.activeAnnouncements);
export const useAnnouncementLoading = () =>
  useAnnouncementStore((state) => state.isLoading);
export const useAnnouncementError = () =>
  useAnnouncementStore((state) => state.error);
