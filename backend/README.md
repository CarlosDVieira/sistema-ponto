# PontoFácil — Backend API

## Instalação no servidor

```bash
# 1. Copie os arquivos para o servidor
scp -r backend/ root@IP:/var/www/pontofacil/

# 2. Instale as dependências
cd /var/www/pontofacil/backend
npm install

# 3. Crie as tabelas
npm run migrate

# 4. Popule dados iniciais
npm run seed

# 5. Inicie com PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## Credenciais padrão (seed)

```
URL:   http://IP_DO_SERVIDOR
Email: admin@pontofacil.com
Senha: admin123
Role:  master
```
⚠️ Troque a senha após o primeiro acesso!

---

## Endpoints da API

### Autenticação

| Método | Rota                  | Descrição           | Auth |
|--------|-----------------------|---------------------|------|
| POST   | /api/auth/login       | Login               | ❌   |
| POST   | /api/auth/logout      | Logout              | ✅   |
| GET    | /api/auth/me          | Dados do usuário    | ✅   |
| PUT    | /api/auth/senha       | Alterar senha       | ✅   |
| POST   | /api/auth/refresh     | Renovar token       | ❌   |

### Empresas (master)

| Método | Rota                  | Descrição           | Role     |
|--------|-----------------------|---------------------|----------|
| GET    | /api/empresas         | Listar empresas     | master   |
| POST   | /api/empresas         | Criar empresa       | master   |
| GET    | /api/empresas/:id     | Buscar empresa      | master/admin |
| PUT    | /api/empresas/:id     | Atualizar empresa   | master/admin |
| DELETE | /api/empresas/:id     | Desativar empresa   | master   |
| POST   | /api/empresas/:id/logo| Upload logo         | master/admin |

### Usuários

| Método | Rota                    | Descrição           | Role         |
|--------|-------------------------|---------------------|--------------|
| GET    | /api/usuarios           | Listar              | master/admin/supervisor |
| POST   | /api/usuarios           | Criar               | master/admin |
| GET    | /api/usuarios/:id       | Buscar              | todos (próprio) |
| PUT    | /api/usuarios/:id       | Atualizar           | master/admin |
| DELETE | /api/usuarios/:id       | Desativar           | master/admin |
| POST   | /api/usuarios/:id/foto  | Upload foto         | todos (próprio) |

**Query params para listar:**
- `?depto=UUID` — filtra por departamento
- `?role=user|supervisor|admin|master` — filtra por perfil
- `?busca=texto` — busca por nome/email/matrícula

### Departamentos

| Método | Rota                      | Descrição      | Role         |
|--------|---------------------------|----------------|--------------|
| GET    | /api/departamentos        | Listar         | todos        |
| POST   | /api/departamentos        | Criar          | master/admin |
| PUT    | /api/departamentos/:id    | Atualizar      | master/admin |
| DELETE | /api/departamentos/:id    | Excluir        | master/admin |

### Ponto

| Método | Rota              | Descrição                    | Role  |
|--------|-------------------|------------------------------|-------|
| POST   | /api/ponto/registrar | Bater ponto (entrada/saída) | todos |
| GET    | /api/ponto/hoje   | Registros do dia             | todos |
| GET    | /api/ponto/status | Status atual                 | todos |
| GET    | /api/ponto/online | Colaboradores online (Redis) | master/admin/supervisor |

### Relatórios

| Método | Rota                      | Descrição              | Role         |
|--------|---------------------------|------------------------|--------------|
| GET    | /api/relatorios/meu       | Relatório pessoal      | todos        |
| GET    | /api/relatorios/departamento | Relatório do depto  | master/admin/supervisor |
| GET    | /api/relatorios/empresa   | Relatório geral        | master/admin |
| GET    | /api/relatorios/exportar  | Exportar CSV           | master/admin/supervisor |

**Query params para relatórios:**
- `?mes=YYYY-MM` — mês desejado (padrão: mês atual)
- `?depto=UUID` — departamento (para /departamento)

---

## Exemplos de uso (curl)

```bash
# Login
curl -X POST http://IP/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pontofacil.com","senha":"admin123"}'

# Bater ponto (com token)
curl -X POST http://IP/api/ponto/registrar \
  -H "Authorization: Bearer SEU_TOKEN"

# Relatório pessoal do mês
curl http://IP/api/relatorios/meu?mes=2026-03 \
  -H "Authorization: Bearer SEU_TOKEN"

# Exportar CSV do departamento
curl http://IP/api/relatorios/exportar?mes=2026-03 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o relatorio.csv
```

---

## Estrutura de arquivos

```
backend/
├── src/
│   ├── server.js          ← entrada da aplicação
│   ├── app.js             ← Express + middlewares + rotas
│   ├── config/
│   │   ├── database.js    ← PostgreSQL (pool + helpers)
│   │   └── redis.js       ← Redis (sessão, cache, online, fila)
│   ├── database/
│   │   ├── migrate.js     ← cria as tabelas
│   │   └── seed.js        ← dados iniciais
│   ├── middlewares/
│   │   ├── auth.js        ← JWT + roles
│   │   └── upload.js      ← multer (fotos)
│   ├── routes/            ← definição das rotas
│   ├── controllers/       ← lógica de cada rota
│   └── models/            ← (reservado para futuras abstrações)
├── ecosystem.config.js    ← configuração PM2
└── package.json
```

---

## Comandos úteis

```bash
# Desenvolvimento local
npm run dev

# Produção
pm2 start ecosystem.config.js

# Ver logs
pm2 logs pontofacil

# Reiniciar
pm2 restart pontofacil

# Recriar tabelas (cuidado — apaga dados!)
npm run migrate

# Popular dados iniciais
npm run seed
```
