from fastapi import FastAPI

from backend_api.routes.auth import router as auth_router
from backend_api.routes.artifacts import router as artifacts_router
from backend_api.routes.runs import router as runs_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://172.27.200.118:5173",
        "http://172.17.0.1:5173",
        "http://172.19.0.1:5173",
        "http://172.27.200.162:63465",
        "http://172.27.200.118:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(artifacts_router)
app.include_router(runs_router)