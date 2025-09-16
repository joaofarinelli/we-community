import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, Globe, Users, Info, MoreHorizontal, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useIsAdmin } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { eventSchema, type EventFormData } from '@/lib/schemas';
import { EventLocationSelector } from './EventLocationSelector';
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
  // Payment fields from DB (snake_case)
  is_paid?: boolean;
  price_coins?: number;
  payment_required?: boolean;
}

interface EditEventDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditEventDialog = ({ event, open, onOpenChange }: EditEventDialogProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const updateEvent = useUpdateEvent();
  const isAdmin = useIsAdmin();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: "",
      description: "",
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

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      const startTime = format(startDate, 'HH:mm');
      const endTime = format(endDate, 'HH:mm');
      
      // Extract presenter from description if it exists
      const presenter = event.description?.startsWith('Apresentador: ') 
        ? event.description.replace('Apresentador: ', '') 
        : '';
      
      form.reset({
        title: event.title,
        description: event.description || "",
        presenter,
        startDate: startDate,
        startTime,
        endDate: endDate,
        endTime,
        locationType: (event.location_type as 'presencial' | 'online' | 'indefinido') || 'indefinido',
        locationAddress: event.location_address || "",
        onlineLink: event.online_link || "",
        imageUrl: event.image_url || "",
        isPaid: event.is_paid ?? false,
        priceCoins: event.price_coins ?? 0,
        paymentRequired: event.payment_required ?? false,
      });
    }
  }, [event, form]);

  const onSubmit = async (values: EventFormData) => {
    const startDateTime = new Date(`${values.startDate.toDateString()} ${values.startTime}`);
    const endDateTime = new Date(`${values.endDate.toDateString()} ${values.endTime}`);
    
    const description = values.presenter ? `Apresentador: ${values.presenter}` : values.description;

    await updateEvent.mutateAsync({
      id: event.id,
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

    onOpenChange(false);
  };

  const handlePublish = async () => {
    const newStatus = event.status === 'draft' ? 'active' : 'draft';
    await updateEvent.mutateAsync({
      id: event.id,
      status: newStatus,
    });
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-3xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-xl font-semibold flex items-center justify-between">
            Editar Evento
            {event.status === 'draft' && (
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md font-normal">
                Rascunho
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {event.status === 'active' && !isAdmin && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este evento está ativo. Apenas administradores podem editar eventos ativos. 
              Você pode despublicar o evento para torná-lo editável novamente.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            {/* Disable form fields for active events if user is not admin */}
            <fieldset disabled={event.status === 'active' && !isAdmin}>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="banner" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Banner
                </TabsTrigger>
                <TabsTrigger value="people" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Pessoas
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  Pagamento
                </TabsTrigger>
                <TabsTrigger value="basics" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Infos. Básicas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o título do evento" {...field} />
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
                          placeholder="Digite a descrição do evento" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <EventLocationSelector 
                  control={form.control as any}
                  locationType={form.watch('locationType')}
                />
              </TabsContent>

              <TabsContent value="banner" className="space-y-6 mt-6">
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
              </TabsContent>

              <TabsContent value="payment" className="space-y-6 mt-6">
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

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={updateEvent.isPending || (event.status === 'active' && !isAdmin)}
                    className="w-full sm:w-auto"
                  >
                    {updateEvent.isPending ? 'Salvando...' : 'Salvar Pagamento'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="people" className="space-y-6 mt-6">
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
              </TabsContent>

              <TabsContent value="basics" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de início</FormLabel>
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
                        <FormLabel>Horário de início</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <FormLabel>Data de fim</FormLabel>
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
                        <FormLabel>Horário de fim</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
               </TabsContent>
             </Tabs>
            </fieldset>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
              <div className="flex gap-2">
                {event.status === 'draft' && (
                  <Button
                    type="button"
                    onClick={handlePublish}
                    disabled={updateEvent.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateEvent.isPending ? 'Publicando...' : 'Publicar Evento'}
                  </Button>
                )}
                {event.status === 'active' && isAdmin && (
                  <Button
                    type="button"
                    onClick={handlePublish}
                    disabled={updateEvent.isPending}
                    variant="outline"
                  >
                    {updateEvent.isPending ? 'Despublicando...' : 'Despublicar Evento'}
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                disabled={updateEvent.isPending || (event.status === 'active' && !isAdmin)}
                onClick={form.handleSubmit(onSubmit)}
              >
                {updateEvent.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
 );
};