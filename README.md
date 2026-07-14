# AI-Powered Crop Advisory & Disease Resolution Assistant

This is a full-stack, mobile-responsive web application designed to diagnose crop leaf diseases, assess soil and weather conditions, and provide localized multilingual remedies using computer vision (multimodal LLM analysis) and LangGraph.

---

## Folder Structure

```
crop_advisory_assistant/
├── backend/
│   ├── .venv/               # Python virtual environment (ignored in git)
│   ├── data/                # Local settings and scan logs (ignored in git)
│   ├── database.py          # JSON database manager
│   ├── llm_client.py        # LLM client setup (Gemini + Custom OpenAI)
│   ├── main.py              # FastAPI server endpoints
│   ├── requirements.txt     # Python backend dependencies
│   └── workflow.py          # LangGraph diagnostic workflow
├── frontend/
│   ├── node_modules/        # Frontend node packages (ignored in git)
│   ├── src/                 # React source files (App.jsx, index.css, components)
│   ├── index.html           # Main SPA entry point
│   ├── package.json         # Node frontend dependencies
│   └── vite.config.js       # Vite configuration
└── .gitignore               # Root git ignore definitions
```

---

## Step-by-Step Running Instructions

Follow these instructions exactly to run both backend and frontend servers on your local machine:

### 1. Stop any old background processes (Crucial)
If another server process is already running on port `8000` (backend) or port `5173`/`5174` (frontend), your new server will either fail to start or bind to a different port, resulting in a blank template or connection issues. Make sure to close any active command lines.

### 2. Start the Backend (FastAPI)
1. Open a new terminal window/command prompt.
2. Navigate to the backend folder:
   ```bash
   cd C:\Users\Arnab\.gemini\antigravity\scratch\crop_advisory_assistant\backend
   ```
3. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD)**:
     ```cmd
     .venv\Scripts\activate.bat
     ```
   * **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```
4. Start the FastAPI server using uvicorn:
   ```bash
   uvicorn main:app --port 8000 --reload
   ```
   *Confirm the terminal logs display:* `INFO: Uvicorn running on http://127.0.0.1:8000`

### 3. Start the Frontend (Vite + React)
1. Open a **second** terminal window/command prompt (keep the backend terminal running).
2. Navigate to the frontend folder:
   ```bash
   cd C:\Users\Arnab\.gemini\antigravity\scratch\crop_advisory_assistant\frontend
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Check the port printed in the console! 
   * By default, Vite attempts to bind to `http://localhost:5173/`. 
   * If that port is already in use by a background task, it will print `Port 5173 is in use, trying another one...` and bind to **`http://localhost:5174/`**.
   * **Always open the exact URL displayed in the terminal logs!**

---

## GitHub Upload Instructions

When pushing this code repository to GitHub, you want to upload only your source code and configurations. The binary environments, logs, and sensitive configurations must be ignored.

### 1. Root .gitignore
We have already created a root `.gitignore` file for you in the project root. It will prevent git from tracking the following folders:
- `backend/.venv/` (too large, easily rebuilt using `requirements.txt`)
- `frontend/node_modules/` (too large, easily rebuilt using `package.json`)
- `backend/data/` (contains local history and keys, **do not upload to avoid exposing API keys**)

### 2. Git Commands to Push to GitHub
1. Open a terminal in the root folder `C:\Users\Arnab\.gemini\antigravity\scratch\crop_advisory_assistant`.
2. Initialize git repository:
   ```bash
   git init
   ```
3. Add files to staging:
   ```bash
   git add .
   ```
4. Commit:
   ```bash
   git commit -m "Initial commit - Crop Advisory Assistant"
   ```
5. Link to your GitHub repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
