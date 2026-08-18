import type { HTMLAttributes, ReactNode } from "react";

import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** `.day` dans la référence : paddé. `.ritual` : non paddé (le padding vit sur .body interne). */
  padded?: boolean;
  /** `.day:hover` dans la référence. `.ritual` n'a pas ce comportement. */
  hoverLift?: boolean;
}

export function Card({ children, padded = false, hoverLift = false, className, ...props }: CardProps) {
  const classes = [styles.card, padded ? styles.padded : null, hoverLift ? styles.hoverLift : null, className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
