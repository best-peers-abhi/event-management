import { apiClient } from './api';
import {
  AttendeesResponse,
  CreateEventDto,
  Event,
  EventFilterParams,
  EventRegistration,
  UpdateEventDto,
} from '../types';

export const eventService = {
  /**
   * Get all events with optional title/location search filter
   */
  getAll: async (params?: EventFilterParams): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>('/event', { params });
    return response.data;
  },

  /**
   * Get single event by ID with capacity and seat counts
   */
  getById: async (id: number): Promise<Event> => {
    const response = await apiClient.get<Event>(`/event/${id}`);
    return response.data;
  },

  /**
   * Create a new event (TCP RPC + Kafka event.created emit)
   */
  create: async (dto: CreateEventDto): Promise<Event> => {
    const response = await apiClient.post<Event>('/event', dto);
    return response.data;
  },

  /**
   * Update event details (Organizer only)
   */
  update: async (id: number, dto: UpdateEventDto): Promise<Event> => {
    const response = await apiClient.patch<Event>(`/event/${id}`, dto);
    return response.data;
  },

  /**
   * Delete an event and its registrations (Organizer only)
   */
  delete: async (id: number): Promise<{ message: string; eventId: number }> => {
    const response = await apiClient.delete<{ message: string; eventId: number }>(`/event/${id}`);
    return response.data;
  },

  /**
   * Register for an event (Capacity check + ticket emit)
   */
  register: async (eventId: number): Promise<EventRegistration> => {
    const response = await apiClient.post<EventRegistration>(`/event/${eventId}/register`);
    return response.data;
  },

  /**
   * Cancel event registration and release reserved seat
   */
  cancel: async (eventId: number): Promise<{ message: string; eventId: number; userId: number }> => {
    const response = await apiClient.delete<{ message: string; eventId: number; userId: number }>(
      `/event/${eventId}/register`
    );
    return response.data;
  },

  /**
   * Get attendee roster for an event (Organizer only)
   */
  getAttendees: async (eventId: number): Promise<AttendeesResponse> => {
    const response = await apiClient.get<AttendeesResponse>(`/event/${eventId}/attendees`);
    return response.data;
  },
};
