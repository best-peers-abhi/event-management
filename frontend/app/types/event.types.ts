export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  registeredCount?: number;
  remainingSeats?: number;
}

export interface CreateEventDto {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
}

export interface EventRegistration {
  id: number;
  eventId: number;
  userId: number;
  registeredAt: string;
}

export interface AttendeesResponse {
  eventId: number;
  eventTitle: string;
  totalAttendees: number;
  attendees: EventRegistration[];
}

export interface EventFilterParams {
  search?: string;
}
