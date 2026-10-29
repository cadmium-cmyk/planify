import React from 'react';
import {
  Folder,
  Briefcase,
  Home,
  Code,
  Sparkles,
  Book,
  Target,
  Hash,
  Star,
  Heart,
  Wrench,
  Globe,
  Compass,
  Bookmark,
} from 'lucide-react';
import { Project } from '../types/planify';

interface ProjectIconProps {
  project: Project;
  className?: string;
}

export const ProjectIcon: React.FC<ProjectIconProps> = ({ project, className = 'w-4 h-4' }) => {
  // If icon_type is emoji and emoji exists
  if (project.icon_type === 'emoji' && project.emoji) {
    return <span className="text-sm shrink-0">{project.emoji}</span>;
  }

  // If icon_type is symbolic and icon_symbolic exists
  if (project.icon_type === 'symbolic' && project.icon_symbolic) {
    const iconProps = { className, style: { color: project.color } };
    switch (project.icon_symbolic) {
      case 'briefcase':
        return <Briefcase {...iconProps} />;
      case 'home':
        return <Home {...iconProps} />;
      case 'code':
        return <Code {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'book':
        return <Book {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      case 'hash':
        return <Hash {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      case 'wrench':
        return <Wrench {...iconProps} />;
      case 'globe':
        return <Globe {...iconProps} />;
      case 'compass':
        return <Compass {...iconProps} />;
      case 'bookmark':
        return <Bookmark {...iconProps} />;
      case 'folder':
      default:
        return <Folder {...iconProps} />;
    }
  }

  // Default: clean colored circle dot
  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: project.color }}
    />
  );
};
