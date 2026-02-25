from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import connect_db
from .routes import products, transactions, users, returns


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    connect_db()
    yield


app = FastAPI(title="ICA Always-On Checkout API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(transactions.router)
app.include_router(users.router)
app.include_router(returns.router)


@app.get("/health")
def health():
    return {"status": "ok"}


def start():
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)


if __name__ == "__main__":
    start()
