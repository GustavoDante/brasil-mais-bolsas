"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

/**
 * Campo de senha com alternância de visibilidade.
 *
 * O botão é `type="button"` de propósito: dentro de um `<form>`, o padrão do HTML é
 * `submit`, e clicar no olho enviaria o formulário. Fica fora da ordem de tabulação
 * (`tabIndex={-1}`) para não interromper quem navega por teclado entre os campos.
 */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const describedById = useId();

  return (
    <InputGroup className={cn("h-11", className)}>
      <InputGroupInput
        {...props}
        type={visible ? "text" : "password"}
        className="h-11"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-sm"
          tabIndex={-1}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          aria-describedby={describedById}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
      <span id={describedById} className="sr-only">
        {visible ? "A senha está visível." : "A senha está oculta."}
      </span>
    </InputGroup>
  );
}
