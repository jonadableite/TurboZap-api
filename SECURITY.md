# Security Policy

Política de segurança para o TurboZap-api. Siga estas orientações para reportar vulnerabilidades de forma segura e responsável.

## Versões Suportadas

| Versão / Branch         | Suporte de segurança |
|-------------------------|----------------------|
| `main`                  | ✅ patches e hotfixes |
| Releases `>= 1.0.x`     | ✅ correções de segurança |
| Releases `< 1.0`        | ❌ best-effort, sem SLA |

## Como Reportar uma Vulnerabilidade

1) Prefira abrir um **GitHub Security Advisory** privado (Security > Advisories) para este repositório.  
2) Se não for possível, envie um e-mail para **security@turbozap.dev** com o assunto `SECURITY | <breve resumo>`.

Inclua obrigatoriamente:
- Descrição clara do problema e impacto esperado.
- Passo a passo para reproduzir (incluindo payloads/PoCs minimizados).
- Escopo afetado (endpoint/rota, método HTTP, parâmetros, papéis de usuário).
- Ambiente/teste (SO, navegador ou cliente, versão do app/API, variáveis relevantes).
- Logs ou capturas de tela **sem dados sensíveis**; use dados fictícios.

Por favor, **não abra issues ou PRs públicos** para relatar falhas de segurança.

## SLA e Linha do Tempo

- Confirmação de recebimento: até **2 dias úteis**.
- Triagem inicial e severidade: até **5 dias úteis**.
- Atualizações de status: pelo menos **1 vez por semana** enquanto o caso estiver aberto.
- Divulgação coordenada: normalmente entre **30–90 dias** após correção, combinada com o reporter.

## Escopo

Coberto:
- APIs e serviços do TurboZap-api.
- Painel web e autenticação associada.
- Integrações oficiais documentadas.

Fora de escopo:
- Ataques de negação de serviço volumétrica (DoS, DDoS, brute force massivo).
- Engenharia social, phishing ou ataques físicos.
- Vulnerabilidades em dependências sem prova de exploração no produto.
- Scans automatizados sem validação manual.

## Boas Práticas para Testes

- Utilize contas e dados de teste; não use informações reais de usuários.
- Não interrompa o serviço ou dados de outros usuários.
- Minimize impacto: limite carga, volume de requisições e escopo.
- Se precisar compartilhar detalhes sensíveis, solicite chave PGP pelo canal de segurança.

## Reconhecimento

No momento não há programa de bug bounty. Agradecemos responsáveis divulgando de forma coordenada; mencionaremos contribuidores (se desejarem) nas notas de versão relacionadas à correção.

