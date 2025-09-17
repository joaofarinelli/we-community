import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { formatAddress } from '@/lib/formatAddress';
import { toast } from 'sonner';

interface UpdateEventData {
  id: string;
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  maxParticipants?: number;
  imageUrl?: string;
  status?: 'draft' | 'active';
  locationType?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  onlineLink?: string;
  locationCoordinates?: string;
  isPaid?: boolean;
  priceCoins?: number;
  paymentRequired?: boolean;
}

export const useUpdateEvent = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate !== undefined) updateData.start_date = data.startDate.toISOString();
      if (data.endDate !== undefined) updateData.end_date = data.endDate.toISOString();
      if (data.location !== undefined) updateData.location = data.location;
      if (data.maxParticipants !== undefined) updateData.max_participants = data.maxParticipants;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.locationType !== undefined) updateData.location_type = data.locationType;
      if (data.address !== undefined) updateData.street = data.address;
      if (data.number !== undefined) updateData.number = data.number;
      if (data.complement !== undefined) updateData.complement = data.complement;
      if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.state !== undefined) updateData.state = data.state;
      if (data.postalCode !== undefined) updateData.postal_code = data.postalCode;
      if (data.onlineLink !== undefined) updateData.online_link = data.onlineLink;
      if (data.locationCoordinates !== undefined) updateData.location_coordinates = data.locationCoordinates;
      
      // Generate formatted address for backward compatibility
      if (data.address || data.number || data.complement || data.neighborhood || data.city || data.state || data.postalCode) {
        updateData.location_address = formatAddress({
          street: data.address,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          postal_code: data.postalCode,
        });
      }
      if (data.locationCoordinates !== undefined) updateData.location_coordinates = data.locationCoordinates;
      if (data.isPaid !== undefined) updateData.is_paid = data.isPaid;
      if (data.priceCoins !== undefined) updateData.price_coins = data.priceCoins;
      if (data.paymentRequired !== undefined) updateData.payment_required = data.paymentRequired;

      const { data: event, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', data.id)
        .eq('company_id', currentCompanyId)
        .select()
        .single();

      if (error) throw error;
      return event;
    },
    onSuccess: (_, variables) => {
      // Invalidate events queries for the space
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['allUserEvents'] });
      toast.success('Evento atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar evento');
    },
  });
};