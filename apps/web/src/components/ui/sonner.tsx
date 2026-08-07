"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Container dos toasts — montado uma vez no layout raiz.
 *
 * Sem `next-themes` no projeto, o tema fica em `light`, que é o único que a interface usa
 * hoje. As cores saem dos tokens de `globals.css` para o toast não destoar do resto.
 */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      richColors
      closeButton
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
