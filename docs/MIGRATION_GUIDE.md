# Guia de Migração: WhatsApp Web para Cloud API

Este documento descreve as diferenças entre a TurboZap API (baseada em whatsmeow/WhatsApp Web) e a WhatsApp Cloud API oficial da Meta, e como migrar entre elas.

## Comparação de Recursos

### Mensagens Interativas

| Recurso | TurboZap (WhatsApp Web) | Cloud API |
|---------|------------------------|-----------|
| **Botões de Resposta** | ✅ Suportado (até 3 botões) | ✅ Suportado |
| **Listas** | ✅ Suportado (até 10 seções) | ✅ Suportado |
| **Carrossel** | ❌ Simulado com múltiplas imagens | ✅ Nativo |
| **Templates** | ❌ Não suportado | ✅ Obrigatório para iniciar conversas |
| **Catálogo de Produtos** | ❌ Não suportado | ✅ Suportado |

### Autenticação e Conexão

| Aspecto | TurboZap | Cloud API |
|---------|----------|-----------|
| **Autenticação** | QR Code | API Token + Verificação de Negócio |
| **Múltiplos Números** | Multi-instância | Múltiplos WBAs |
| **Reconexão** | Automática | Sempre conectado |
| **Rate Limits** | WhatsApp interno | Definido pela Meta |

### Custos

| Item | TurboZap | Cloud API |
|------|----------|-----------|
| **Infraestrutura** | Self-hosted (seu custo) | Meta hospeda |
| **Por Mensagem** | Gratuito | ~$0.005 - $0.08 |
| **Conversas Business-Initiated** | N/A | Cobrado |
| **Conversas User-Initiated** | N/A | Geralmente gratuitas (24h) |

## Mapeamento de Endpoints

### Envio de Mensagens

```
TurboZap                           Cloud API
────────                           ─────────
POST /message/:instance/text  →    POST /{phone_id}/messages
POST /message/:instance/media →    POST /{phone_id}/messages (com media_id)
POST /message/:instance/button →   POST /{phone_id}/messages (interactive)
POST /message/:instance/list →     POST /{phone_id}/messages (interactive)
```

### Exemplo de Conversão: Botões

**TurboZap (atual):**
```json
{
  "to": "5511999999999",
  "text": "Escolha uma opção",
  "buttons": [
    {"id": "btn_1", "text": "Sim"},
    {"id": "btn_2", "text": "Não"}
  ]
}
```

**Cloud API:**
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Escolha uma opção"
    },
    "action": {
      "buttons": [
        {"type": "reply", "reply": {"id": "btn_1", "title": "Sim"}},
        {"type": "reply", "reply": {"id": "btn_2", "title": "Não"}}
      ]
    }
  }
}
```

### Exemplo de Conversão: Listas

**TurboZap (atual):**
```json
{
  "to": "5511999999999",
  "title": "Menu",
  "description": "Escolha uma opção",
  "button_text": "Abrir menu",
  "sections": [
    {
      "title": "Seção 1",
      "rows": [
        {"id": "r1", "title": "Opção 1", "description": "Detalhe"}
      ]
    }
  ]
}
```

**Cloud API:**
```json
{
  "messaging_product": "whatsapp",
  "to": "5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {"type": "text", "text": "Menu"},
    "body": {"text": "Escolha uma opção"},
    "action": {
      "button": "Abrir menu",
      "sections": [
        {
          "title": "Seção 1",
          "rows": [
            {"id": "r1", "title": "Opção 1", "description": "Detalhe"}
          ]
        }
      ]
    }
  }
}
```

## Webhooks

### Mapeamento de Eventos

| TurboZap | Cloud API |
|----------|-----------|
| `message_received` | `messages` (statuses) |
| `message_ack` | `messages` (statuses: sent, delivered, read) |
| `connection_update` | N/A (sempre conectado) |
| `qrcode_update` | N/A (sem QR code) |

### Formato de Webhook

**TurboZap:**
```json
{
  "event": "message_received",
  "instance_id": "uuid",
  "instance": "minha-instancia",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "message_id": "...",
    "from": "5511999999999",
    "type": "text",
    "content": "Olá!"
  }
}
```

**Cloud API:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "5511999999999",
          "id": "...",
          "type": "text",
          "text": {"body": "Olá!"}
        }]
      },
      "field": "messages"
    }]
  }]
}
```

## Checklist de Migração

### Pré-Migração

- [ ] Criar conta Meta Business
- [ ] Verificar negócio no Meta Business Suite
- [ ] Criar WhatsApp Business Account (WABA)
- [ ] Registrar número de telefone
- [ ] Gerar API Token permanente
- [ ] Configurar webhook no Meta Dashboard

### Durante a Migração

- [ ] Adaptar payloads de mensagens
- [ ] Converter handlers de webhook
- [ ] Implementar templates para mensagens proativas
- [ ] Atualizar autenticação (API Token vs API Key)
- [ ] Migrar mídia para Cloud API media endpoints

### Pós-Migração

- [ ] Testar todos os fluxos de mensagens
- [ ] Verificar recebimento de webhooks
- [ ] Monitorar custos por mensagem
- [ ] Ajustar rate limits conforme tier
- [ ] Desativar instâncias TurboZap após confirmação

## Vantagens da Migração

1. **Confiabilidade**: Infraestrutura gerenciada pela Meta
2. **Recursos Nativos**: Carrosséis, catálogos, templates
3. **Escalabilidade**: Sem limites de hardware próprio
4. **Suporte**: Canal oficial de suporte da Meta
5. **Compliance**: Termos de serviço claros

## Desvantagens da Migração

1. **Custo**: Cobrança por mensagem/conversa
2. **Templates**: Necessário criar e aprovar templates
3. **Flexibilidade**: Menos controle sobre a infraestrutura
4. **Vendor Lock-in**: Dependência da plataforma Meta

## Recursos Úteis

- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- [Cloud API Getting Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Interactive Messages Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#interactive-messages)
- [Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

