# InvestorOS Chat

> 💬 A local-first, streaming AI chat application built with React, Node.js, and Ollama.

---

## ✨ Features

- ⚡ **Streaming responses** via Server-Sent Events (SSE)  
- 🧩 **Modular architecture** (frontend + backend + model server)  
- 🎨 **Modern UI** powered by React + MUI  
- 🔌 **Backend API** with Express and robust SSE handling  
- 🤖 **LLM integration** with [Ollama](https://ollama.ai) (default: Mistral model)  
- 🛑 **Abortable requests** (cancel ongoing chat in real time)  
- 📜 **Chat history** with user + assistant roles  
- 📱 **Responsive layout** (desktop/mobile friendly)

---

## 🏗️ Architecture
React (frontend)
|
| fetch + SSE
v
Express (backend) ---> Ollama API (localhost:11434)


- **Frontend** (`ChatPage.jsx` + `streamChat.js`)  
  Handles user input, message rendering, and streaming tokens.  
- **Backend** (`chat.js`)  
  Provides `/api/chat` (sync) and `/api/chat/stream` (stream) endpoints.  
- **Ollama**  
  Local LLM runner, defaults to `mistral: latest`.

  ### 1. Prerequisites
- Node.js ≥ 18
- Yarn or npm
- [Ollama](https://ollama.ai) installed locally

### 2. Clone & Install
```bash
git clone https://github.com/your-username/investoros-chat.git
cd investoros-chat

# Install backend deps
cd server
npm install

# Install frontend deps
cd ../client
npm install
