import { 
  FileText, 
  Calendar, 
  MessageCircle, 
  GraduationCap, 
  Users, 
  Image,
  type LucideIcon 
} from 'lucide-react';

export type SpaceType = 'publications' | 'events' | 'chat' | 'course' | 'members' | 'images';

export interface SpaceTypeInfo {
  type: SpaceType;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const spaceTypes: SpaceTypeInfo[] = [
  {
    type: 'publications',
    name: 'Publicações',
    description: 'Compartilhe artigos, novidades e conteúdos',
    icon: FileText,
  },
  {
    type: 'events',
    name: 'Eventos',
    description: 'Organize e gerencie eventos da comunidade',
    icon: Calendar,
  },
  {
    type: 'chat',
    name: 'Chat',
    description: 'Conversas em tempo real entre membros',
    icon: MessageCircle,
  },
  {
    type: 'course',
    name: 'Curso',
    description: 'Crie e compartilhe materiais educativos',
    icon: GraduationCap,
  },
  {
    type: 'members',
    name: 'Membros',
    description: 'Gerencie e conecte membros da comunidade',
    icon: Users,
  },
  {
    type: 'images',
    name: 'Imagens',
    description: 'Galeria de fotos e imagens compartilhadas',
    icon: Image,
  },
];

export const getSpaceIcon = (type: string): LucideIcon => {
  const spaceType = spaceTypes.find(st => st.type === type);
  return spaceType?.icon || FileText;
};

export const getSpaceTypeInfo = (type: SpaceType): SpaceTypeInfo | undefined => {
  return spaceTypes.find(st => st.type === type);
};