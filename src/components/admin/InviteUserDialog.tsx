import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useInviteUser } from "@/hooks/useInviteUser";

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "member"], {
    message: "Selecione um papel",
  }),
  courseAccess: z.array(z.string()).default([]),
});

export const InviteUserDialog = () => {
  const [open, setOpen] = useState(false);
  const { data: courses } = useCourses();
  const inviteUser = useInviteUser();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "member" as const,
      courseAccess: [] as string[],
    },
  });

  const selectedRole = form.watch("role");

  const onSubmit = async (data: any) => {
    const courseAccess = selectedRole === "admin" ? [] : (data.courseAccess || []);
    
    await inviteUser.mutateAsync({
      email: data.email,
      role: data.role,
      courseAccess,
    });

    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convidar Novo Membro</DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um novo membro à sua empresa.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole === "member" && courses && courses.length > 0 && (
              <FormField
                control={form.control}
                name="courseAccess"
                render={() => (
                  <FormItem>
                    <FormLabel>Acesso aos Cursos</FormLabel>
                    <div className="space-y-2">
                      {courses.map((course) => (
                        <FormField
                          key={course.id}
                          control={form.control}
                          name="courseAccess"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={course.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(course.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), course.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== course.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {course.title}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending ? "Enviando..." : "Enviar Convite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};