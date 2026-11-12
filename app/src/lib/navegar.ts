/** Leva o navegador a outro endereço (o checkout do Mercado Pago, por exemplo). Fica à parte para os testes poderem trocar. */
export function irPara(url: string): void {
  window.location.assign(url);
}
