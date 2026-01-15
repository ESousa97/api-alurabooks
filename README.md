
---

# API AluraBooks – Backend Mock com Autenticação JWT

*Um backend mock robusto e realista para simular e-commerces com autenticação moderna, acelerando o desenvolvimento frontend.*

---

## Visão Geral

No desenvolvimento de aplicações web modernas, especialmente usando frameworks como React, um backend confiável é essencial para simular cenários reais de consumo de dados e autenticação. O projeto **API AluraBooks** oferece uma API REST mock de alta fidelidade, com endpoints públicos e protegidos por autenticação JWT, permitindo o desenvolvimento e a prototipação do frontend de forma ágil, realista e sem dependências externas complexas.

O sistema combina a simplicidade do [`json-server`](https://github.com/typicode/json-server) para CRUD automático a partir de um `database.json`, com uma camada Node.js personalizada para autenticação segura baseada em JSON Web Tokens (JWT). Assim, é possível experimentar todos os fluxos reais de registro, login, obtenção de token e acesso a rotas protegidas, de maneira leve e didática.

---

## Badges

![CI](https://github.com/ESousa97/api-alurabooks/actions/workflows/ci.yml/badge.svg)
![CodeFactor](https://www.codefactor.io/repository/github/esousa97/api-alurabooks/badge)
![CodeQL](https://github.com/ESousa97/api-alurabooks/actions/workflows/codeql.yml/badge.svg)
![Licença](https://img.shields.io/github/license/ESousa97/api-alurabooks)

---

## Sumário

1. [Introdução](#introdução)
2. [Arquitetura](#arquitetura)
3. [Diferenciais do Projeto](#diferenciais-do-projeto)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Tech Stack](#tech-stack)
6. [Estrutura do Projeto](#estrutura-do-projeto)
7. [Pré-requisitos](#pré-requisitos)
8. [Instalação e Uso](#instalação-e-uso)
9. [Exemplos de Uso](#exemplos-de-uso)
10. [Referência da API](#referência-da-api)
11. [Testes e Qualidade](#testes-e-qualidade)
12. [Deployment e Escopo](#deployment-e-escopo)
13. [Contribuição](#contribuição)
14. [Licença](#licença)
15. [Equipe e Créditos](#equipe-e-créditos)
16. [FAQ](#faq)
17. [Contato](#contato)

---

## Introdução

O **API AluraBooks** foi criado para suprir a carência de backends simulados realistas, com autenticação e controle de acesso, facilitando a vida de quem está aprendendo, prototipando ou validando integrações frontend.

Diferente de mocks simplistas, aqui você encontra fluxos completos de registro, login, emissão e validação de tokens JWT e acesso a endpoints realmente protegidos, em um ambiente fácil de subir e editar.

---

## Arquitetura

A arquitetura é minimalista, moderna e modular, focada em *developer experience*:

* **Node.js Server:** Orquestrador principal e camada de autenticação.
* **Autenticação JWT:** Rotas públicas para login/registro, emissão e validação de tokens.
* **Middleware de Proteção:** Exige token válido nas rotas privadas.
* **JSON Server:** CRUD completo e instantâneo baseado no `database.json`.
* **Armazenamento em arquivos:** Usuários (`usuarios.json`) e dados da aplicação (`database.json`).

### Esquema Simplificado

```mermaid
graph TD
  Client[Frontend/Cliente]
  NodeServer[Node.js (src/server.js)]
  JSONServer[json-server]
  Users[usuarios.json]
  Data[database.json]
  JWTLib[jsonwebtoken]

    Client -- HTTP --> NodeServer
    NodeServer -- Requisições públicas/privadas --> JSONServer
    NodeServer -- Geração/validação de token --> JWTLib
    NodeServer -- Operações de usuário --> Users
    JSONServer -- CRUD de dados --> Data
```

---

## Diferenciais do Projeto

* **Fluxos reais de autenticação:** JWT emitido e validado a cada requisição protegida.
* **Simples de rodar:** Nenhuma dependência externa além de Node.js.
* **Extremamente editável:** Dados facilmente manipuláveis via arquivos JSON.
* **Didático:** Ideal para treinar, ensinar ou experimentar integrações frontend sem montar um backend completo.
* **Padrão de mercado:** Experiência idêntica ao fluxo de APIs modernas.

---

## Funcionalidades Principais

* **Registro de Usuário:** `POST /public/registrar`
* **Login:** `POST /public/login` (gera `access_token`)
* **Endpoints REST (CRUD) protegidos:** `/livros`, `/pedidos` (token obrigatório)
* **Endpoints públicos:** `/public/lancamentos`
* **Proteção real por JWT:** Fluxo completo, simula produção
* **Fácil extensão:** Basta editar `database.json` ou criar novas rotas em `src/server.js`

---

## Tech Stack

| Categoria           | Tecnologia     | Observação                     |
| ------------------- | -------------- | ------------------------------ |
| **Runtime**         | Node.js >=14.x | Padrão da indústria            |
| **API Mock**        | json-server    | CRUD REST automático           |
| **Auth**            | jsonwebtoken   | Geração e validação de JWT     |
| **Middleware**      | body-parser    | Parse de requests JSON         |
| **Banco de Dados**  | Arquivos JSON  | Simples, editável, zero config |
| **Package Manager** | npm            | Gerenciamento de dependências  |

---

## Estrutura do Projeto

```
api-alurabooks-main/
├── .github/
├── docs/
├── src/
│   └── server.js
├── tests/
├── .env.example
├── .gitignore
├── README.md
├── database.json
├── package.json
├── package-lock.json
├── usuarios.json
└── thumbnail.png
```

---

## Pré-requisitos

* **Node.js:** versão 14.x ou superior.
* **npm:** geralmente já vem com o Node.
* (Opcional) **Ferramenta de API:** Postman, Insomnia ou `curl`.

---

## Instalação e Uso

1. **Clone o repositório**

   ```bash
   git clone https://github.com/ESousa97/api-alurabooks.git
   cd api-alurabooks-main
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure variáveis de ambiente:**

  ```bash
  cp .env.example .env
  ```

4. **Execute o servidor:**

   * **Modo autenticado (recomendado):**

     ```bash
     npm run start-auth
     ```

    API disponível em `http://localhost:8000`.

   * **Modo aberto (sem auth):**

     ```bash
     npm run start
     ```

     API pública em `http://localhost:3000`.

---

## Exemplos de Uso

**1. Registro de usuário**

```bash
curl -X POST http://localhost:8000/public/registrar -H "Content-Type: application/json" -d '{ "nome": "Ada Lovelace", "email": "ada@example.com", "senha": "password123" }'
```

**2. Login**

```bash
curl -X POST http://localhost:8000/public/login -H "Content-Type: application/json" -d '{ "email": "ada@example.com", "senha": "password123" }'
```

**3. Acesso autenticado**

```bash
curl -X GET http://localhost:8000/livros -H "Authorization: Bearer <SEU_TOKEN_AQUI>"
```

**4. Rota pública**

```bash
curl -X GET http://localhost:8000/public/lancamentos
```

---

## Referência da API

### Autenticação

* `POST /public/registrar`
  Cria novo usuário.
  Campos obrigatórios: `nome`, `email` (único), `senha`

* `POST /public/login`
  Retorna `access_token` e dados do usuário.

### Dados protegidos (JWT necessário)

* `GET /livros`, `POST /livros`, etc.
* `GET /pedidos`
  *(CRUD completo via json-server, consulte [json-server docs](https://github.com/typicode/json-server))*

### Dados públicos

* `GET /public/lancamentos`

---

## Testes e Qualidade

Execute os testes:

```bash
npm test
```

Lint e formatação:

```bash
npm run lint
npm run format
```

CI automatizado com GitHub Actions (lint, testes e audit) e análise CodeQL.

---

## Deployment e Escopo

> **Atenção:** Este projeto é para **desenvolvimento local e fins educacionais**.
> Não utilize em produção: arquivos JSON não são adequados para ambientes multiusuário, cloud ou dados sensíveis.

---

## Contribuição

Contribua com PRs e issues!

1. Fork e branch:

   ```bash
   git checkout -b feature/nome-da-feature
   ```
2. Commits descritivos ([Conventional Commits](https://www.conventionalcommits.org/))
3. PR na branch `main` deste repositório

---

## Licença

Distribuído sob Licença ISC.
Leia o texto completo em [ISC License](https://opensource.org/licenses/ISC).

---

## Equipe e Créditos

* **Autor original:** Vinicios Neves (Alura)
* **Mantenedor:** [Enoque Sousa](https://www.linkedin.com/in/enoque-sousa-bb89aa168/)

---

## FAQ

* **Erro 401?**
  Obtenha o token pelo login antes de acessar rotas protegidas.

* **Produção?**
  Não, apenas para desenvolvimento local/mock.

* **Adicionar dados?**
  Edite `database.json` e reinicie o servidor.

---

## Contato

Dúvidas ou sugestões?
Abra uma [issue no GitHub](https://github.com/ESousa97/api-alurabooks/issues).

---


> ✨ **Criado em:** 4 de jun. de 2024 às 20:31

---

