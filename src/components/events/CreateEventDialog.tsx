import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, ChevronDown } from 'lucide-react';
import { EditEventDialog } from './EditEventDialog';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreateEvent } from '@/hooks/useCreateEvent';
import { cn } from '@/lib/utils';
import { eventSchema, type EventFormData } from '@/lib/schemas';
import { EventLocationSelector } from './EventLocationSelector';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  image_url?: string;
  location_type?: string;
  location_address?: string;
  online_link?: string;
  status: 'draft' | 'active';
}

interface CreateEventDialogProps {
  spaceId: string;
}

export const CreateEventDialog = ({ spaceId }: CreateEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const createEvent = useCreateEvent();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      presenter: "",
      startDate: new Date(),
      startTime: "09:00",
      endDate: new Date(),
      endTime: "10:00",
      locationType: "indefinido" as const,
      locationAddress: "",
      onlineLink: "",
      imageUrl: "",
      isPaid: false,
      priceCoins: 0,
      paymentRequired: false,
    },
  });

  const onSubmit = async (values: EventFormData) => {
    const startDateTime = new Date(`${values.startDate.toDateString()} ${values.startTime}`);
    const endDateTime = new Date(`${values.endDate.toDateString()} ${values.endTime}`);
    
    const description = values.presenter ? `Apresentador: ${values.presenter}` : values.description;
    
    try {
      const event = await createEvent.mutateAsync({
        spaceId,
        title: values.title,
        description,
        startDate: startDateTime,
        endDate: endDateTime,
        imageUrl: values.imageUrl,
        locationType: values.locationType,
        locationAddress: values.locationAddress,
        onlineLink: values.onlineLink,
        isPaid: values.isPaid,
        priceCoins: values.priceCoins,
        paymentRequired: values.paymentRequired,
      });
      
      setCreatedEvent(event as Event);
      form.reset();
      setOpen(false);
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Plus className="h-4 w-4" />
            Criar Evento
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <SheetTitle className="text-xl font-semibold">Criar Novo Evento</SheetTitle>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Qual é o evento?</h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do evento *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o título do evento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="presenter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apresentador</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome do apresentador" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banner do Evento</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            onRemove={() => field.onChange("")}
                            bucketName="event-banners"
                            maxSizeKB={5000}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Quando será o evento?</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de início *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Selecionar data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de início *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar horário" />
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de fim *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Selecionar data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de fim *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar horário" />
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Onde será o evento?</h3>
                  
                  <EventLocationSelector 
                    control={form.control}
                    locationType={form.watch('locationType')}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Configurações de Pagamento</h3>
                  
                  <FormField
                    control={form.control}
                    name="isPaid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Evento Pago</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Este evento requer pagamento para participar?
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('isPaid') && (
                    <FormField
                      control={form.control}
                      name="priceCoins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço em moedas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Digite o preço em moedas"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={createEvent.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? "Salvando..." : "Salvar Rascunho"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {createdEvent && (
        <EditEventDialog
          event={createdEvent}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </>
  );
};