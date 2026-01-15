# Arquitetura

## Visão geral
A API AluraBooks é uma API mock construída com Node.js e json-server, adicionando autenticação JWT e rotas públicas específicas para simular cenários reais de e-commerce.

## Componentes principais
- **Servidor HTTP**: inicializa o app e expõe a API.
- **json-server**: fornece CRUD automático a partir de `database.json`.
- **Auth JWT**: autentica usuários e protege rotas privadas.
- **Armazenamento**: arquivos JSON (`database.json` e `usuarios.json`).

## Fluxo de autenticação
1. Usuário registra/login em rotas públicas.
2. O backend gera um `access_token` JWT.
3. Rotas protegidas exigem `Authorization: Bearer <token>`.

## Limitações
Este projeto é voltado a desenvolvimento local e fins educacionais. Não é adequado para produção sem persistência e segurança adicionais.
