from fastapi import FastAPI

from backend_api.routes.auth import router as auth_router
from backend_api.routes.artifacts import router as artifacts_router
from backend_api.routes.runs import router as runs_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(artifacts_router)
app.include_router(runs_router)