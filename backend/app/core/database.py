from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import settings


client = MongoClient(
    settings.mongodb_uri,
    serverSelectionTimeoutMS=5000,
)

database: Database = client[settings.mongodb_db_name]


def ping_database(mongo_client=client) -> bool:
    result = mongo_client.admin.command("ping")
    return result.get("ok") == 1.0