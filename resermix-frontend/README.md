# ReserMix — Frontend (React + Vite)

Frontend em React para o backend Spring Boot do projeto **ReserMX CRUD**, com:

- **Login** — compara e-mail/senha direto contra `GET /usuarios` (não há endpoint de autenticação no backend; a senha não é tratada com hash, então use isso apenas para fins de apresentação/estágio, não em produção).
- **Tela do Coordenador** — CRUD completo de Salas e Usuários (abas), igual ao painel administrativo original.
- **Tela do Professor** — visualização das salas disponíveis para reserva (`GET /salas/disponiveis`).

## Pré-requisitos

- Node.js 18+ instalado
- Backend Spring Boot rodando em `http://localhost:8081` (porta definida em `application.properties`)
- Banco PostgreSQL configurado e populado com pelo menos um usuário (veja seção "Criando o primeiro usuário")

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Rodar o backend Spring Boot (em outro terminal, dentro da pasta do projeto Java)
./mvnw spring-boot:run

# 3. Rodar o frontend React
npm run dev
```

O frontend abre em `http://localhost:5173`.

A URL da API fica configurada no arquivo `.env`:

```
VITE_API_URL=http://localhost:8081
```

Se o seu backend rodar em outra porta/host, basta alterar esse valor.

## Criando o primeiro usuário para testar o login

Como o login compara contra os usuários cadastrados, você precisa ter pelo menos um usuário no banco antes de logar. Duas formas:

**Opção 1 — via Swagger/Postman**, faça um `POST` direto para `http://localhost:8081/usuarios`:
```json
{
  "name": "Coordenador Teste",
  "email": "coord@teste.com",
  "senha": "123456",
  "dtype": "CORDENADOR"
}
```
e outro com `"dtype": "PROFESSOR"` para testar a tela do professor.

**Opção 2** — acesse `http://localhost:8081/swagger-ui` (se o springdoc estiver ativo) e use a interface do Swagger para criar os usuários.

## Estrutura do projeto

```
src/
  components/       → AbaSalas, AbaUsuarios, RotaProtegida, Toast (reutilizáveis)
  context/          → AuthContext (estado de login)
  pages/            → Login, Coordenador, Professor (rotas/telas)
  services/         → api.js (todas as chamadas fetch para o Spring Boot)
  App.jsx           → definição das rotas
  main.jsx          → ponto de entrada
```

## Observação sobre CORS

O `WebConfig.java` do backend foi ajustado para liberar o método `PATCH` (usado em `/salas/{id}/status`), além de `GET`, `POST`, `PUT`, `DELETE` que já estavam liberados.
