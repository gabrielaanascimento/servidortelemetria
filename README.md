# Servidor de Telemetria 🚀

Um servidor backend robusto para recepção, processamento e distribuição de dados de telemetria em tempo real. Projetado para integrar comunicação HTTP convencional com WebSockets, este servidor é ideal para aplicações de IoT (como integrações com **ESP32** ou **Raspberry Pi**) e monitoramento contínuo para **dashboards veiculares**.

## 🛠️ Tecnologias Utilizadas

- **[Node.js](https://nodejs.org/)** - Ambiente de execução
- **[Express](https://expressjs.com/)** - Framework para rotas HTTP (API REST)
- **[WebSocket (ws)](https://github.com/websockets/ws)** - Comunicação bidirecional em tempo real
- **[Bcrypt](https://www.npmjs.com/package/bcrypt)** - Criptografia de senhas (hash)
- **[JWT (JSON Web Token)](https://jwt.io/)** - Autenticação segura
- **[Dotenv](https://www.npmjs.com/package/dotenv)** - Gerenciamento de variáveis de ambiente

## 📂 Estrutura do Projeto

```text
servidortelemetria/
├── src/
│   ├── dataBase/
│   │   └── config.js       # Configuração de conexão com o banco de dados
│   └── server.js           # Ponto de entrada principal do servidor (HTTP + WS)
├── .env                    # Variáveis de ambiente (não versionado)
├── .gitignore              # Arquivos e pastas ignoradas pelo Git
├── package.json            # Dependências e metadados do projeto
└── package-lock.json       # Árvore de dependências exata
```

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
Certifique-se de ter o **Node.js** e o **npm** instalados em seu ambiente.

### 2. Instalação
Após baixar ou clonar os arquivos do servidor, acesse a pasta raiz pelo terminal e instale as dependências:
```bash
npm install
```

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (mesmo nível do `package.json`) e defina as variáveis necessárias para a segurança e porta do servidor:
```env
PORT=3000
JWT_SECRET=sua_chave_secreta_super_segura_aqui
```

### 4. Inicialização
Para iniciar o servidor, execute:
```bash
node src/server.js
```
O console exibirá uma mensagem confirmando que o servidor está rodando e aceitando conexões HTTP e WebSocket na porta configurada.

## 📡 Endpoints da API (HTTP)

### Gerenciamento de Acesso
- **`POST /cadastro`**: Registra um novo usuário ou dispositivo. Espera receber `nome`, `email` e `senha` no corpo da requisição (JSON). A senha é protegida por hash antes da persistência.
- **`POST /login`**: Autentica o usuário. Espera `email` e `senha`. Em caso de sucesso, retorna uma mensagem de confirmação e um token **JWT** que deve ser utilizado para validar as próximas interações.

## ⚡ Comunicação em Tempo Real (WebSocket)

A interface de WebSocket divide a mesma porta do servidor HTTP, otimizando a infraestrutura para a recepção dos dados contínuos.

- **Conexão Cliente:** `ws://localhost:3000/`
- **Comportamento:** O servidor aguarda conexões de clientes. Assim que recebe pacotes de dados (mensagens contendo leituras de sensores, atuadores, etc.), ele realiza o *broadcast*, retransmitindo essa informação imediatamente para todos os outros clientes conectados, permitindo atualizações visuais de dashboard com zero atraso perceptível.

## 👨‍💻 Autor

Desenvolvido por **Gabriel Augusto Assis Nascimento**.
