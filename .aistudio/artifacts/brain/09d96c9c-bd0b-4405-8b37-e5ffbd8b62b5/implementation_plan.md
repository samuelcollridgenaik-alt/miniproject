# Vercel Deployment & FastAPI Backend Diagnostic Plan

## Problem Assessment & Log Analysis

Based on your clarification that **Vercel runtime function logs show an error** when `app` calls the **internal `backend_python` microservice**, we identified 5 specific failure modes in the current configuration:

1. **Service Binding URL Parsing & Protocol Failure (`TypeError: Invalid URL`)**:
   - In `server.ts`, the URL is parsed using `new URL('/health', pythonUrl)`.
   - Vercel service bindings can inject internal hostnames (`backend_python.internal` or bare hostnames) without an explicit `https://` or `http://` protocol scheme. Calling `new URL()` with a scheme-less base throws a fatal `TypeError: Invalid URL` at runtime.
   - Furthermore, relative path joining with a leading slash (`/health`) strips any path prefix that Vercel or a reverse proxy injects.

2. **Cold Start Timeout (`AbortError: operation was aborted`)**:
   - The fetch call in `server.ts` uses `AbortSignal.timeout(4000)` (4 seconds).
   - In Vercel serverless environments, Python cold starts (`@vercel/python` bootstrapping ASGI + dependencies) frequently take **4 to 8 seconds** on the initial invocation.
   - A 4-second timeout aborts the request before FastAPI responds, logging an abort/timeout error in Vercel function logs.

3. **Entrypoint & ASGI Handler Ambiguity in `vercel.json`**:
   - `vercel.json` currently specifies `"framework": "fastapi"`, but does not declare `"entrypoint": "main.py"`.
   - Depending on the Vercel CLI version, Vercel may default to looking for `api/index.py` instead of `main.py`, causing `FUNCTION_INVOCATION_FAILED` or `Cannot find module / entrypoint`.

4. **Environment Variable Scoping in Multi-Service Projects**:
   - In `backend_python/main.py`, `os.getenv("GEMINI_API_KEY")` and `os.getenv("GROQ_API_KEY")` are read directly.
   - In Vercel multi-service setups, environment variables set at the project root must be explicitly assigned to `backend_python` in Vercel Project Settings; otherwise, `backend_python` runs with `None` values.

5. **FastAPI Form-Data & Multipart Dependency**:
   - `backend_python/main.py` defines `upload_document(file: UploadFile = File(...))`.
   - Without `python-multipart` pinned in `backend_python/requirements.txt`, FastAPI crashes with `RuntimeError: Form data requires python-multipart` whenever files are posted.

---

## Proposed Remediation Plan

### Step 1: Resilient Service Binding URL Resolver & Error Diagnostics (`server.ts` & `server/config.ts`)
- Implement a robust `resolveServiceUrl(base, path)` utility that:
  - Guarantees valid protocol prefixes (`https://` or `http://`).
  - Safely normalizes trailing and leading slashes.
  - Increases the inter-service timeout from 4s to 20s with exponential backoff on cold starts.
  - Adds verbose, structured error diagnostics logging the raw `BACKEND_PYTHON_URL` (masked host), target endpoint, HTTP status, and response headers/body for immediate troubleshooting in Vercel function logs.

### Step 2: Explicit Entrypoint & Service Definition (`vercel.json`)
- Update `vercel.json` to explicitly configure `backend_python`:
  - `"entrypoint": "main.py"`
  - `"framework": "fastapi"`
  - Keep `backend_python` internal (no public rewrite), while `app` retains its binding:
    ```json
    {
      "type": "service",
      "service": "backend_python",
      "format": "url",
      "env": "BACKEND_PYTHON_URL"
    }
    ```

### Step 3: Hardened FastAPI Health & Diagnostic Endpoints (`backend_python/main.py`)
- Enhance `/health` to return environment variable presence indicators (`has_gemini_key`, `has_groq_key`, `python_version`, `timestamp`).
- Ensure all endpoints return structured JSON with CORS headers and proper exception handlers to prevent unhandled 500 errors in Lambda logs.
- Add `python-multipart` and verify all imports are serverless-safe.

### Step 4: Verification & Live Inter-Service Test Route
- Test the integration endpoint `/api/python/health` and verify with `compile_applet` and `lint_applet`.
- Provide exact Vercel dashboard verification steps to check environment variable assignments and verify zero Lambda size or timeout errors.
