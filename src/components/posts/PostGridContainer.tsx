import { ReactNode } from 'react';

interface PostGridContainerProps {
  children: ReactNode;
}

export const PostGridContainer = ({ children }: PostGridContainerProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
};