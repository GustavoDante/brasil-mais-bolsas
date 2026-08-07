"use client";

import { useEffect, useRef, useState } from "react";

import { fetchAddressByCep, isCompleteCep, onlyDigits, type CepAddress } from "@/lib/viacep";

/**
 * Busca o endereço assim que o CEP fica completo e entrega o que o ViaCEP devolveu.
 *
 * Quem chama decide o que fazer com o resultado (o nome dos campos muda de formulário para
 * formulário), mas o cuidado que importa fica aqui: só busca com CEP completo, não repete a
 * mesma consulta a cada tecla e aborta se o CEP mudar no meio do caminho.
 *
 * O `apply` fica numa ref (atualizada em efeito, nunca durante o render — mesmo padrão de
 * `useApiQuery`) para quem usa poder passar uma closure inline: uma função nova a cada
 * render, se fosse dependência do efeito, dispararia a busca em looping.
 */
export function useCepAutofill(cep: string, apply: (address: CepAddress) => void): boolean {
  const [loading, setLoading] = useState(false);
  const lastLookup = useRef<string | null>(null);
  const applyRef = useRef(apply);

  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    const digits = onlyDigits(cep ?? "");

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
        applyRef.current(address);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [cep]);

  return loading;
}
