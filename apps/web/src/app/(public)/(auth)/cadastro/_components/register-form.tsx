"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
  type Control,
  type FieldPath,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { register as registerAccount } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { homeRouteFor } from "@/lib/auth/roles";
import { isSafeRedirectPath } from "@/lib/utils";
import {
  fetchAddressByCep,
  formatCep,
  isCompleteCep,
  onlyDigits,
} from "@/lib/viacep";
import {
  registerInputSchema,
  type RegisterInput,
} from "@/schemas/auth/register.schema";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

interface TextFieldProps {
  control: Control<RegisterInput>;
  name: FieldPath<RegisterInput>;
  label: string;
  /** Sem isto o campo é opcional e ganha a marcação discreta em vez do asterisco. */
  required?: boolean;
  type?: string;
  inputMode?: "numeric" | "decimal" | "text";
  autoComplete?: string;
  placeholder?: string;
  description?: string;
  className?: string;
}

/**
 * O cadastro tem 21 campos; repetir o bloco `Controller` + `Field` em cada um esconderia
 * a única coisa que varia entre eles (rótulo, obrigatoriedade, tipo).
 */
function TextField({
  control,
  name,
  label,
  required = false,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  description,
  className,
}: TextFieldProps) {
  const id = `register-${name.replace(".", "-")}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={id}>
            {label}
            {required ? (
              <span aria-hidden className="text-destructive">
                *
              </span>
            ) : (
              <span className="text-xs font-normal text-muted-foreground">
                opcional
              </span>
            )}
          </FieldLabel>
          <Input
            {...field}
            value={typeof field.value === "string" ? field.value : ""}
            id={id}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={placeholder}
            required={required}
            className="h-11"
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

/**
 * Busca o endereço assim que o CEP fica completo e preenche o que o ViaCEP devolver.
 *
 * Só sobrescreve os campos que vieram preenchidos na resposta: CEP de interior costuma vir
 * sem logradouro/bairro, e apagar o que a pessoa já digitou seria pior que não preencher.
 * `shouldValidate` limpa o erro dos campos que acabaram de ganhar valor.
 */
function useCepAutofill(
  cep: string,
  setValue: UseFormSetValue<RegisterInput>,
): boolean {
  const [loading, setLoading] = useState(false);
  const lastLookup = useRef<string | null>(null);

  useEffect(() => {
    const digits = onlyDigits(cep);

    if (!isCompleteCep(digits)) {
      lastLookup.current = null;
      return;
    }

    // Sem isto, cada tecla depois do 8º dígito (ex.: a máscara) refaria a busca.
    if (lastLookup.current === digits) return;
    lastLookup.current = digits;

    const controller = new AbortController();
    setLoading(true);

    fetchAddressByCep(digits, controller.signal)
      .then((address) => {
        if (controller.signal.aborted || !address) return;

        const options = { shouldValidate: true } as const;
        if (address.street) setValue("address.street", address.street, options);
        if (address.district)
          setValue("address.district", address.district, options);
        if (address.city) setValue("address.city", address.city, options);
        if (address.state) setValue("address.state", address.state, options);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [cep, setValue]);

  return loading;
}

interface RegisterFormProps {
  /** Destino pós-cadastro herdado de `/entrar?callbackUrl=...`. */
  callbackUrl?: string;
}

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      birthdate: "",
      cpf: "",
      rg: "",
      rg_emissor: "",
      secondary_phone: "",
      whatsapp_phone: "",
      friend_phone: "",
      family_income: "",
      ccp: "",
      partner_code: "",
      address: {
        street: "",
        number: "",
        district: "",
        complement: "",
        city: "",
        state: "",
        postal_code: "",
      },
    },
  });

  const { control, setValue } = form;
  const cep = form.watch("address.postal_code");
  const cepLoading = useCepAutofill(cep, setValue);

  const onSubmit = async (data: RegisterInput) => {
    setFormError(null);
    const result = await registerAccount(data);

    if (!result.ok) {
      for (const [field, messages] of Object.entries(
        result.error.fieldErrors ?? {},
      )) {
        form.setError(field as FieldPath<RegisterInput>, {
          message: messages[0],
        });
      }
      setFormError(result.error.message);
      return;
    }

    // O cadastro já devolve sessão gravada — o aluno entra direto. O papel sempre sai
    // `user` desta rota, mas o destino passa por `homeRouteFor` do mesmo jeito: assim não
    // há uma rota escrita à mão para desatualizar se o cadastro um dia ganhar outro caminho.
    router.push(
      isSafeRedirectPath(callbackUrl)
        ? callbackUrl
        : homeRouteFor(result.data.type),
    );
    router.refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-8">
        <FieldSet>
          <FieldLegend variant="label">Dados pessoais</FieldLegend>
          <FieldDescription>
            Usamos o CPF para confirmar sua identidade junto à instituição.
          </FieldDescription>

          <FieldGroup className="gap-5">
            <TextField
              control={control}
              name="name"
              label="Nome completo"
              required
              autoComplete="name"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                control={control}
                name="email"
                label="E-mail"
                required
                type="email"
                autoComplete="email"
              />
              <TextField
                control={control}
                name="birthdate"
                label="Data de nascimento"
                required
                type="date"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <TextField
                control={control}
                name="cpf"
                label="CPF"
                required
                inputMode="numeric"
                placeholder="000.000.000-00"
              />
              <TextField control={control} name="rg" label="RG" required />
              <TextField
                control={control}
                name="rg_emissor"
                label="Órgão emissor"
                required
                placeholder="SSP-PE"
              />
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend variant="label">Contato</FieldLegend>
          <FieldDescription>
            O telefone principal é por onde a instituição fala com você.
          </FieldDescription>

          <FieldGroup className="gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                control={control}
                name="phone"
                label="Telefone"
                required
                type="tel"
                autoComplete="tel"
                placeholder="(81) 90000-0000"
              />
              <TextField
                control={control}
                name="whatsapp_phone"
                label="WhatsApp"
                type="tel"
              />
              <TextField
                control={control}
                name="secondary_phone"
                label="Telefone secundário"
                type="tel"
              />
              <TextField
                control={control}
                name="friend_phone"
                label="Telefone de recado"
                type="tel"
              />
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend variant="label">Endereço</FieldLegend>
          <FieldDescription>
            Digite o CEP e preenchemos o resto para você.
          </FieldDescription>

          <FieldGroup className="gap-5">
            {/* CEP primeiro: é ele que preenche rua, bairro, cidade e UF. */}
            <Controller
              control={control}
              name="address.postal_code"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="sm:max-w-[220px]"
                >
                  <FieldLabel htmlFor="register-address-postal_code">
                    CEP
                    <span aria-hidden className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupInput
                      {...field}
                      id="register-address-postal_code"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="00000-000"
                      required
                      className="h-11"
                      aria-invalid={fieldState.invalid}
                      aria-busy={cepLoading}
                      value={formatCep(field.value ?? "")}
                      onChange={(event) =>
                        field.onChange(formatCep(event.target.value))
                      }
                    />
                    {cepLoading && (
                      <InputGroupAddon align="inline-end">
                        <Loader2
                          className="animate-spin text-brand-blue-700"
                          aria-hidden
                        />
                        <span className="sr-only">Buscando endereço…</span>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
              <TextField
                control={control}
                name="address.street"
                label="Rua"
                required
                autoComplete="address-line1"
              />
              <TextField
                control={control}
                name="address.number"
                label="Número"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                control={control}
                name="address.district"
                label="Bairro"
                required
              />
              <TextField
                control={control}
                name="address.complement"
                label="Complemento"
                placeholder="Apto, bloco…"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
              <TextField
                control={control}
                name="address.city"
                label="Cidade"
                required
                autoComplete="address-level2"
              />

              {/* Radix Select não emite `onChange` nativo — precisa de `Controller`. */}
              <Controller
                control={control}
                name="address.state"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-address-state">
                      UF
                      <span aria-hidden className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="register-address-state"
                        className="h-11 w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend variant="label">Outras informações</FieldLegend>
          <FieldDescription>
            Opcionais — ajudam a instituição a avaliar seu perfil.
          </FieldDescription>

          <FieldGroup className="gap-5">
            <div className="grid gap-5 sm:grid-cols-3">
              <TextField
                control={control}
                name="family_income"
                label="Renda familiar"
                inputMode="decimal"
                placeholder="2500.00"
              />
              <TextField control={control} name="ccp" label="CCP" />
              <TextField
                control={control}
                name="partner_code"
                label="Código do parceiro"
              />
            </div>
          </FieldGroup>
        </FieldSet>

        {formError && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
          >
            {formError}
          </p>
        )}

        <Field>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-12 w-full bg-brand-blue-800 text-base font-bold text-white hover:bg-brand-blue-900"
          >
            {form.formState.isSubmitting ? "Criando conta..." : "Criar conta"}
          </Button>
          <FieldDescription className="text-center">
            Sua senha inicial será o seu CPF (somente números). Você poderá
            alterá-la depois de entrar.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
