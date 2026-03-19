import { lazy, Suspense } from "react";
import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

interface CategoryIconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

const fallback = <div className="w-4 h-4 rounded-full bg-muted" />;

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const iconName = name as keyof typeof dynamicIconImports;
  if (!dynamicIconImports[iconName]) {
    return <div className="w-4 h-4 rounded-full bg-muted-foreground/30" />;
  }
  const LucideIcon = lazy(dynamicIconImports[iconName]);
  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
}
