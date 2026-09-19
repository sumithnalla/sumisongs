"""Shared utilities for MongoDB document serialization."""
from bson import ObjectId
from pydantic import BaseModel, field_validator
from typing import Any


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        else:
            result[key] = value
    return result


def serialize_docs(docs: list[dict]) -> list[dict]:
    """Convert list of MongoDB documents."""
    return [serialize_doc(doc) for doc in docs if doc is not None]
