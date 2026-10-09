import os
import tempfile

# Point the settings at a throwaway database before the app is imported.
_db_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_db_dir}/test.db"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.main import app  # noqa: E402

API = settings.api_v1_prefix


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client
