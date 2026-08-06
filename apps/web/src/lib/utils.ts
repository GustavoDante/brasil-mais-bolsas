import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Caminho interno seguro para redirecionar depois do login.
 *
 * O `callbackUrl` chega pela query string, então é entrada do usuário: sem esta checagem,
 * `?callbackUrl=https://outro-site` faria a própria tela de login mandar a pessoa para
 * fora do domínio logo após autenticar (open redirect). `//evil.com` e `/\evil.com` são
 * barrados porque o navegador os resolve como URL absoluta.
 */
export function isSafeRedirectPath(path?: string | null): path is string {
  return (
    !!path &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/\\")
  )
}

/**
 * Preserva o destino pós-login ao navegar entre as telas de autenticação.
 *
 * Sem isto, quem cai em `/entrar?callbackUrl=/dashboard` e clica em "Criar conta" perde o
 * destino no meio do caminho e termina o cadastro na home, não na página que pediu.
 */
export function withCallbackUrl(href: string, callbackUrl?: string): string {
  if (!isSafeRedirectPath(callbackUrl)) return href

  return `${href}?callbackUrl=${encodeURIComponent(callbackUrl)}`
}
