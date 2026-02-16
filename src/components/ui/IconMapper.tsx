import {
    HeartHandshake,
    ArrowRight,
    ShieldCheck,
    BookOpen,
    School,
    GraduationCap,
    ChevronDown,
    MessageCircle,
    CheckCircle2,
    Scroll,
    Globe,
    Star,
    LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
    HeartHandshake,
    ArrowRight,
    ShieldCheck,
    BookOpen,
    School,
    GraduationCap,
    ChevronDown,
    MessageCircle,
    CheckCircle2,
    Scroll,
    Globe,
    Star
};

interface IconMapperProps {
    name: string;
    className?: string;
}

export const IconMapper = ({ name, className }: IconMapperProps) => {
    const Icon = iconMap[name];
    if (!Icon) return null;
    return <Icon className={className} />;
};
