# Cognify AI — Python + FastAPI + MySQL Backend
## MCA Mini Project Setup Guide

### 1. Requirements
- Python 3.10+
- MySQL Server 8.0+

### 2. Environment Variables (.env)
```env
GEMINI_API_KEY="your_gemini_api_key"
GROQ_API_KEY="your_groq_api_key"
QWEN_API_KEY="your_qwen_api_key"
MYSQL_DATABASE_URL="mysql+pymysql://root:password@localhost:3306/cognify_ai"
```

### 3. Installation & Run
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI Docs: `http://localhost:8000/docs`
