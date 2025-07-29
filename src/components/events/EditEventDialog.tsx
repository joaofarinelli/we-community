import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, Globe, Users, Info, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUpdateEvent } from '@/hooks/useUpdateEvent';
import { cn } from '@/lib/utils';

const eventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  presenter: z.string().min(1, 'Apresentador é obrigatório'),
  startDate: z.date({ message: 'Data de início é obrigatória' }),
  endDate: z.date({ message: 'Data de fim é obrigatória' }),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de fim é obrigatório'),
  location: z.string().min(1, 'Local é obrigatório'),
  maxParticipants: z.number().optional(),
  isFree: z.boolean().optional().default(true),
}).refine((data) => {
  const start = new Date(`${format(data.startDate, 'yyyy-MM-dd')}T${data.startTime}`);
  const end = new Date(`${format(data.endDate, 'yyyy-MM-dd')}T${data.endTime}`);
  return end > start;
}, {
  message: "Data e hora de fim deve ser posterior ao início",
  path: ["endDate"],
});

type EventFormData = z.infer<typeof eventSchema>;

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_participants?: number;
  status: 'draft' | 'active';
}

interface EditEventDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditEventDialog = ({ event, open, onOpenChange }: EditEventDialogProps) => {
  const updateEvent = useUpdateEvent();
  const [activeTab, setActiveTab] = useState('overview');

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      presenter: '',
      location: '',
      startTime: '17:00',
      endTime: '18:00',
      maxParticipants: 0,
      isFree: true,
    },
  });

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      
      // Extract presenter from description (temporary)
      const presenterMatch = event.description?.match(/Apresentador: (.+)/);
      const presenter = presenterMatch ? presenterMatch[1] : '';

      form.reset({
        title: event.title,
        description: event.description || '',
        presenter,
        startDate,
        endDate,
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        location: event.location || '',
        maxParticipants: event.max_participants || undefined,
        isFree: true,
      });
    }
  }, [event, form]);

  const onSubmit = async (data: any) => {
    if (!event) return;

    const startDateTime = new Date(`${format(data.startDate, 'yyyy-MM-dd')}T${data.startTime}`);
    const endDateTime = new Date(`${format(data.endDate, 'yyyy-MM-dd')}T${data.endTime}`);

    await updateEvent.mutateAsync({
      id: event.id,
      title: data.title,
      description: `Apresentador: ${data.presenter}${data.description ? `\n\n${data.description}` : ''}`,
      startDate: startDateTime,
      endDate: endDateTime,
      location: data.location,
      maxParticipants: data.maxParticipants || undefined,
    });

    onOpenChange(false);
  };

  const handlePublish = async () => {
    if (!event) return;

    await updateEvent.mutateAsync({
      id: event.id,
      status: event.status === 'draft' ? 'active' : 'draft',
    });
  };

  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <div className="max-w-[650px] mx-auto">
          <SheetHeader className="text-left mb-6">
            <SheetTitle>Editar evento</SheetTitle>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="gap-2">
                <Globe className="h-4 w-4" />
                Visão geral
              </TabsTrigger>
              <TabsTrigger value="people" className="gap-2">
                <Users className="h-4 w-4" />
                Pessoas
              </TabsTrigger>
              <TabsTrigger value="basics" className="gap-2">
                <Info className="h-4 w-4" />
                Infos. Básicas
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
                <TabsContent value="overview" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do evento</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Título do evento" 
                            className="bg-muted/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição do evento..."
                            className="bg-muted/50 min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="people" className="space-y-6">
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

                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de participantes</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0 = ilimitado"
                            className="bg-muted/50"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="basics" className="space-y-6">
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
                                  className="p-3"
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
                                  className="p-3"
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

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Local do evento" 
                            className="bg-muted/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Evento gratuito
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Este evento é gratuito para todos os participantes
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
                </TabsContent>

                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    type="button"
                    variant={event.status === 'draft' ? 'default' : 'outline'}
                    onClick={handlePublish}
                    disabled={updateEvent.isPending}
                  >
                    {event.status === 'draft' ? 'Publicar' : 'Despublicar'}
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateEvent.isPending}>
                      {updateEvent.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};