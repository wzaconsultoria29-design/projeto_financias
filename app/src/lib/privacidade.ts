import { useCallback, useSyncExternalStore } from "react";

const CHAVE = "painel-valores-escondidos";

// Se o armazenamento do navegador estiver bloqueado, a escolha vale até recarregar a página.
let memoria: boolean | null = null;
const ouvintes = new Set<() => void>();

/** O modo "esconder valores" vive só neste navegador. Sem acesso ao armazenamento, os valores ficam à mostra. */
export function lerEscondido(): boolean {
  if (memoria !== null) return memoria;
  try {
    return window.localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

export function gravarEscondido(escondido: boolean): void {
  memoria = escondido;
  try {
    window.localStorage.setItem(CHAVE, escondido ? "1" : "0");
  } catch {
    // sem armazenamento: vale a memória desta página
  }
  ouvintes.forEach((avisar) => avisar());
}

function assinar(avisar: () => void): () => void {
  ouvintes.add(avisar);
  // a escolha feita em outra aba chega aqui pelo evento "storage"
  const aoMudarEmOutraAba = () => {
    memoria = null;
    avisar();
  };
  window.addEventListener("storage", aoMudarEmOutraAba);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("storage", aoMudarEmOutraAba);
  };
}

/** [escondido, alternar]. No servidor e na primeira pintura vale "à mostra", e o valor real entra logo depois. */
export function useEscondido(): [boolean, () => void] {
  const escondido = useSyncExternalStore(assinar, lerEscondido, () => false);
  const alternar = useCallback(() => gravarEscondido(!lerEscondido()), []);
  return [escondido, alternar];
}
