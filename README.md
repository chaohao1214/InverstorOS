# 💼 InvestorOS Chat

> 💬 A local-first, streaming AI chat application built with React, Node.js, and Ollama.

InvestorOS Chat enables low-latency, streaming conversations with local LLMs (such as [Ollama](https://ollama.ai)) using **Server-Sent Events (SSE)**.  
This modular project is built to be developer-friendly, self-hostable, and privacy-preserving.

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
```txt
React (frontend)
    |
    | fetch + SSE
    v
Express (backend) ---> Ollama API (localhost:11434)
```
Frontend: React + MUI for chat UI, streaming display, input form, and abort buttons.

Backend: Node.js + Express server handling /api/chat/stream and communicating with Ollama.

LLM Server: Ollama running locally (e.g., mistral, llama2, or phi models).


## ✏️ Getting Started

### Prerequisites

- **Node.js (v18+)**
- **Ollama installed locally**  
  You can install it via:

  ```bash
  brew install ollama


## ✍️ Author

This project is primarily developed and maintained by: **Chaohao Zhu** 👋
