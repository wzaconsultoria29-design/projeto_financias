import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  aceitarTermos: vi.fn(),
}));

import { aceitarTermos, ApiError } from "@/lib/api";
import { VERSAO_LEGAL } from "@/config/legal";
import { TermosAtualizados } from "@/components/painel/TermosAtualizados";

describe("novo aceite quando os termos mudam", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("não aparece quando a pessoa já aceitou a versão atual", () => {
    const { container } = render(<TermosAtualizados versaoAceita={VERSAO_LEGAL} onAceito={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("aparece quando a versão aceita é outra, com os links dos textos e o botão de aceitar", () => {
    render(<TermosAtualizados versaoAceita="v0-2026-01" onAceito={() => {}} />);
    expect(screen.getByRole("dialog", { name: /atualizamos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /termos de uso/i })).toHaveAttribute("href", "/termos");
    expect(screen.getByRole("link", { name: /política de privacidade/i })).toHaveAttribute("href", "/privacidade");
    expect(screen.getByRole("button", { name: /li e aceito/i })).toBeEnabled();
  });

  it("quem nunca aceitou (sem versão) também vê o aviso", () => {
    render(<TermosAtualizados versaoAceita={null} onAceito={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("aceitar envia a versão atual e avisa o painel", async () => {
    vi.mocked(aceitarTermos).mockResolvedValue(undefined);
    const onAceito = vi.fn();
    render(<TermosAtualizados versaoAceita="v0-2026-01" onAceito={onAceito} />);
    fireEvent.click(screen.getByRole("button", { name: /li e aceito/i }));
    await waitFor(() => expect(aceitarTermos).toHaveBeenCalledWith(VERSAO_LEGAL));
    await waitFor(() => expect(onAceito).toHaveBeenCalled());
  });

  it("se falhar, mostra o erro e deixa tentar de novo", async () => {
    vi.mocked(aceitarTermos).mockRejectedValue(new ApiError("falha", "Algo deu errado. Tente de novo em instantes."));
    const onAceito = vi.fn();
    render(<TermosAtualizados versaoAceita="v0-2026-01" onAceito={onAceito} />);
    fireEvent.click(screen.getByRole("button", { name: /li e aceito/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/algo deu errado/i);
    expect(onAceito).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /li e aceito/i })).toBeEnabled();
  });
});
