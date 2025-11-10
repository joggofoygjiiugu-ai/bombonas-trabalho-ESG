# Projeto TODO - Rastreamento de Bombonas

## Backend - Banco de Dados e Modelos

- [x] Criar tabelas no banco de dados (Bombona, Rastreamento, Anotações)
- [x] Implementar schema Drizzle com tipos TypeScript
- [x] Criar helpers de query no server/db.ts

## Backend - API REST (tRPC)

- [x] Criar procedimentos tRPC para CRUD de bombonas
- [x] Implementar API para listar todas as bombonas
- [x] Implementar API para obter detalhes de uma bombona específica
- [x] Implementar API para criar nova bombona com numeração automática (B001, B002, etc.)
- [x] Implementar API para atualizar status de bombona (galpão, a caminho, no local, recolhida, entregue)
- [x] Implementar API para adicionar anotações a uma bombona
- [x] Implementar API para obter histórico completo de status de uma bombona
- [ ] Implementar API para gerar QR Code de uma bombona

## Frontend - Leitor de QR Code

- [x] Instalar biblioteca de leitura de QR Code (jsQR ou similar)
- [x] Criar componente de câmera para captura de QR Code
- [x] Implementar validação de QR Code lido
- [x] Integrar leitor com a API de bombonas

## Frontend - Páginas de Rastreamento

- [x] Criar página de listagem de bombonas
- [x] Criar página de detalhes/rastreamento de uma bombona individual
- [x] Implementar visualização de histórico de status (timeline)
- [x] Criar formulário para atualizar status da bombona
- [x] Criar campo de anotações com possibilidade de adicionar/editar/deletar

## Frontend - Interface de Usuário

- [x] Criar layout principal com navegação
- [x] Implementar página inicial com acesso ao leitor de QR Code
- [x] Implementar página de resultados após leitura de QR Code
- [x] Implementar dashboard com lista de bombonas
- [x] Adicionar autenticação (já vem com o template)

## Integração e Testes

- [ ] Testar fluxo completo: ler QR Code → acessar página → visualizar histórico
- [ ] Testar atualização de status em tempo real
- [ ] Testar persistência de dados no banco de dados
- [ ] Testar adição e edição de anotações
- [ ] Validar numeração automática de bombonas

## Deploy e Entrega

- [ ] Criar checkpoint final
- [ ] Documentar instruções de uso
- [ ] Preparar para publicação
