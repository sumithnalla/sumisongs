"""Shared utilities for MongoDB document serialization."""
from bson import ObjectId
from pydantic import BaseModel, field_validator
from typing import Any


def serialize_value(value: Any) -> Any:
    """Recursively convert BSON/MongoDB types to JSON-safe primitives."""
    if isinstance(value, ObjectId):
        return str(value)
    elif hasattr(value, "isoformat"):
        return value.isoformat()
    elif isinstance(value, dict):
        return {("id" if k == "_id" else k): serialize_value(v) for k, v in value.items()}
    elif isinstance(value, (list, tuple, set)):
        return [serialize_value(item) for item in value]
    return value


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    return serialize_value(doc)


def serialize_docs(docs: list[dict]) -> list[dict]:
    """Convert list of MongoDB documents."""
    return [serialize_doc(doc) for doc in docs if doc is not None]
