import { useCallback, useSyncExternalStore } from "react";
import { gravarEscondido } from "@/lib/privacidade";

export type Tema = "claro" | "escuro" | "auto";

const CHAVE_TEMA = "painel-tema";
const CHAVE_OCULTAR = "painel-ocultar-ao-abrir";
const CHAVE_ABERTO = "painel-aberto";

const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

function ler(chave: string): string | null {
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string): void {
  try {
    window.localStorage.setItem(chave, valor);
  } catch {
    // sem armazenamento: a escolha vale só até recarregar a página
  }
  avisar();
}

/** O tema escolhido neste navegador. Sem escolha (ou com valor estranho), segue o aparelho. */
export function lerTema(): Tema {
  const v = ler(CHAVE_TEMA);
  return v === "claro" || v === "escuro" ? v : "auto";
}

export function gravarTema(tema: Tema): void {
  gravar(CHAVE_TEMA, tema);
}

/** Claro e escuro fixam o tema na página (data-tema); automático solta e o CSS volta a seguir o aparelho. */
export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  if (tema === "auto") raiz.removeAttribute("data-tema");
  else raiz.dataset.tema = tema;
}

export function lerOcultarAoAbrir(): boolean {
  return ler(CHAVE_OCULTAR) === "1";
}

export function gravarOcultarAoAbrir(ligado: boolean): void {
  gravar(CHAVE_OCULTAR, ligado ? "1" : "0");
}

/** Ao abrir o painel (uma vez por aba): aplica o tema guardado e, se a pessoa pediu, começa com os valores escondidos. */
export function aplicarPreferenciasAoAbrir(): void {
  aplicarTema(lerTema());
  try {
    if (window.sessionStorage.getItem(CHAVE_ABERTO)) return;
    window.sessionStorage.setItem(CHAVE_ABERTO, "1");
  } catch {
    // sem armazenamento de sessão: aplica a cada abertura
  }
  if (lerOcultarAoAbrir()) gravarEscondido(true);
}

function assinar(chamar: () => void): () => void {
  ouvintes.add(chamar);
  window.addEventListener("storage", chamar);
  return () => {
    ouvintes.delete(chamar);
    window.removeEventListener("storage", chamar);
  };
}

/** [tema, escolher]. Escolher guarda, aplica na hora e avisa quem estiver lendo. */
export function useTema(): [Tema, (t: Tema) => void] {
  const tema = useSyncExternalStore(assinar, lerTema, () => "auto" as Tema);
  const escolher = useCallback((t: Tema) => {
    gravarTema(t);
    aplicarTema(t);
  }, []);
  return [tema, escolher];
}

/** [ligado, alternar] para "Ocultar valores ao abrir". */
export function useOcultarAoAbrir(): [boolean, () => void] {
  const ligado = useSyncExternalStore(assinar, lerOcultarAoAbrir, () => false);
  const alternar = useCallback(() => gravarOcultarAoAbrir(!lerOcultarAoAbrir()), []);
  return [ligado, alternar];
}
