import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const eventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  presenter: z.string().min(1, 'Apresentador é obrigatório'),
  startDate: z.date({ message: 'Data de início é obrigatória' }),
  endDate: z.date({ message: 'Data de fim é obrigatória' }),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de fim é obrigatório'),
  location: z.string().min(1, 'Local é obrigatório'),
}).refine((data) => {
  const start = new Date(`${format(data.startDate, 'yyyy-MM-dd')}T${data.startTime}`);
  const end = new Date(`${format(data.endDate, 'yyyy-MM-dd')}T${data.endTime}`);
  return end > start;
}, {
  message: "Data e hora de fim deve ser posterior ao início",
  path: ["endDate"],
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  spaceId: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_participants?: number;
  status: 'draft' | 'active';
  [key: string]: any; // Allow additional properties from database
}

export const CreateEventDialog = ({ spaceId }: CreateEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const createEvent = useCreateEvent();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      presenter: '',
      location: '',
      startTime: '17:00',
      endTime: '18:00',
    },
  });

  const onSubmit = async (data: EventFormData) => {
    const startDateTime = new Date(`${format(data.startDate, 'yyyy-MM-dd')}T${data.startTime}`);
    const endDateTime = new Date(`${format(data.endDate, 'yyyy-MM-dd')}T${data.endTime}`);

    const event = await createEvent.mutateAsync({
      spaceId,
      title: data.title,
      description: `Apresentador: ${data.presenter}`,
      startDate: startDateTime,
      endDate: endDateTime,
      location: data.location,
    });

    setOpen(false);
    form.reset();
    
    // Open edit dialog with created event
    setCreatedEvent(event as Event);
    setEditDialogOpen(true);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Evento
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <div className="max-w-[650px] mx-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Criar evento</SheetTitle>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Qual é o evento? */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Qual é o evento?</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Exemplo: Sexta-feira de Perguntas & Respostas" 
                        className="bg-muted/50"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Espaço</FormLabel>
                  <Select defaultValue="events">
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span>➡️</span>
                          <span>Eventos</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="events">
                        <div className="flex items-center gap-2">
                          <span>➡️</span>
                          <span>Eventos</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>

                <FormField
                  control={form.control}
                  name="presenter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apresentador/Palestrante</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome do apresentador"
                          className="bg-muted/50"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Quando será o evento? */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Quando será o evento?</h3>
              
              <div className="space-y-3">
                <FormLabel>Data e hora</FormLabel>
                <div className="flex items-center gap-3 flex-wrap">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-[140px] justify-between bg-muted/50",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MMM dd, yyyy")
                                ) : (
                                  <span>Data</span>
                                )}
                                <ChevronDown className="h-4 w-4" />
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
                              className="p-3 pointer-events-auto"
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-[100px] bg-muted/50">
                              <SelectValue />
                              <ChevronDown className="h-4 w-4" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                  {hour}:00
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <span className="text-muted-foreground">até</span>

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-[140px] justify-between bg-muted/50",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MMM dd, yyyy")
                                ) : (
                                  <span>Data</span>
                                )}
                                <ChevronDown className="h-4 w-4" />
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
                              className="p-3 pointer-events-auto"
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-[100px] bg-muted/50">
                              <SelectValue />
                              <ChevronDown className="h-4 w-4" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                  {hour}:00
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Onde será o evento? */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Onde será o evento?</h3>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Selecione o local" 
                        className="bg-muted/50"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createEvent.isPending}>
                  {createEvent.isPending ? 'Salvando...' : 'Salvar Rascunho'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
      
      <EditEventDialog 
        event={createdEvent}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </Sheet>
  );
};