import * as React from "react";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;
export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={className} {...props} />;
});
Card.displayName = "Card";

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={className} {...props} />;
});
CardContent.displayName = "CardContent";
