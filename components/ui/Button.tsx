import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./Button.module.css";

type Variant = "fill" | "line";
type Size = "default" | "mini";

interface SharedProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function classes(variant: Variant, size: Size, className?: string) {
  return [
    styles.btn,
    variant === "line" ? styles.line : null,
    size === "mini" ? styles.mini : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({ variant = "fill", size = "default", className, ...props }: ButtonProps) {
  if ("href" in props && props.href) {
    const { href, children, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes(variant, size, className)} {...rest}>
        {children}
      </Link>
    );
  }

  const { children, type = "button", ...rest } = props as ButtonAsButton;
  return (
    <button type={type} className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
