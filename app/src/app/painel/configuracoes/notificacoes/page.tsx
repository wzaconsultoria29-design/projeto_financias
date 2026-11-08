const CANAIS = [
  { nome: "WhatsApp", estado: "Só em resposta", texto: "O assistente nunca começa a conversa. Você recebe uma resposta quando manda uma mensagem." },
  { nome: "E-mail", estado: "Em breve", texto: "Aviso de fim do teste, cobranças e recibos, quando o envio de e-mails estiver ligado." },
  { nome: "No painel", estado: "Em breve", texto: "Avisos dentro do painel, como limite de mensagens e fim do teste." },
];

export default function NotificacoesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-tinta">Notificações</h2>
        <p className="mt-1 text-suave">Como e quando o Gastômetro fala com você. Quando houver avisos para escolher, eles aparecem aqui.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {CANAIS.map((c) => (
          <li key={c.nome} className="cartao flex flex-col gap-1.5 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-tinta">{c.nome}</h3>
              <span className="rounded-full bg-folha px-3 py-1 text-sm font-medium text-tinta">{c.estado}</span>
            </div>
            <p className="text-suave">{c.texto}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
