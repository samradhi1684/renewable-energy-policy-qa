from fastapi import FastAPI

from app.api.query import router as query_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.chats import router as chats_router

app = FastAPI(
    title="QA System",
    version="0.0.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    query_router
)

@app.get("/")
def root():
    return {
        "message": "QA System API Running",
        "version": "0.0.1"
    }

@app.get("/health")
def health():

    return {
        "status": "ok"
    }
    

app.include_router(chats_router)