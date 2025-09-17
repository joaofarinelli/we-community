import { useState, useMemo } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_participants?: number;
  image_url?: string;
  event_participants?: any;
  status?: 'draft' | 'active';
  space_id: string;
  created_by: string;
  is_paid?: boolean;
  price_coins?: number;
  payment_required?: boolean;
}

interface SearchFilters {
  query: string;
  status?: 'active' | 'draft' | 'all';
  paymentType?: 'paid' | 'free' | 'all';
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export const useEventsSearch = (events: Event[]) => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    paymentType: 'all',
  });

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Text search in title, description, and location
    if (searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (searchFilters.status && searchFilters.status !== 'all') {
      filtered = filtered.filter(event => event.status === searchFilters.status);
    }

    // Payment type filter
    if (searchFilters.paymentType && searchFilters.paymentType !== 'all') {
      if (searchFilters.paymentType === 'paid') {
        filtered = filtered.filter(event => event.is_paid === true || event.payment_required === true);
      } else if (searchFilters.paymentType === 'free') {
        filtered = filtered.filter(event => !event.is_paid && !event.payment_required);
      }
    }

    // Date range filter
    if (searchFilters.dateRange?.start || searchFilters.dateRange?.end) {
      filtered = filtered.filter(event => {
        const eventStart = parseISO(event.start_date);
        const eventEnd = parseISO(event.end_date);
        
        const filterStart = searchFilters.dateRange?.start;
        const filterEnd = searchFilters.dateRange?.end;

        // If only start date is set
        if (filterStart && !filterEnd) {
          return eventStart >= filterStart || eventEnd >= filterStart;
        }
        
        // If only end date is set
        if (filterEnd && !filterStart) {
          return eventStart <= filterEnd || eventEnd <= filterEnd;
        }
        
        // If both dates are set
        if (filterStart && filterEnd) {
          return isWithinInterval(eventStart, { start: filterStart, end: filterEnd }) ||
                 isWithinInterval(eventEnd, { start: filterStart, end: filterEnd }) ||
                 (eventStart <= filterStart && eventEnd >= filterEnd);
        }
        
        return true;
      });
    }

    // Sort by relevance (events with query match in title first, then by date)
    if (searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase().trim();
      filtered.sort((a, b) => {
        const aInTitle = a.title.toLowerCase().includes(query);
        const bInTitle = b.title.toLowerCase().includes(query);
        
        if (aInTitle && !bInTitle) return -1;
        if (!aInTitle && bInTitle) return 1;
        
        // If both match title or both don't, sort by date
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
    } else {
      // Default sort by date
      filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    }

    return filtered;
  }, [events, searchFilters]);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setSearchFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setSearchFilters({
      query: '',
      status: 'all',
      paymentType: 'all',
    });
  };

  const hasActiveFilters = useMemo(() => {
    return searchFilters.query.trim() !== '' ||
           searchFilters.status !== 'all' ||
           searchFilters.paymentType !== 'all' ||
           searchFilters.dateRange?.start !== undefined ||
           searchFilters.dateRange?.end !== undefined;
  }, [searchFilters]);

  return {
    searchFilters,
    filteredEvents,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    resultsCount: filteredEvents.length,
  };
};