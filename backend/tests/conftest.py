import pytest
from app.database import connect_to_mongo, close_mongo_connection

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(autouse=True)
async def ensure_mongo_connected():
    await connect_to_mongo()
    yield
