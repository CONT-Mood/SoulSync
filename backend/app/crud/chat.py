from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.chat import ChatDBModel
from datetime import datetime

async def save_chat(db: AsyncIOMotorDatabase, chat_data: ChatDBModel):
    collection = db.get_collection("chats")
    await collection.insert_one(chat_data.dict())

async def get_user_chats(db: AsyncIOMotorDatabase, user_id: str, limit: int = 20):
    collection = db.get_collection("chats")
    cursor = collection.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
    chats = await cursor.to_list(length=limit)
    return chats

async def delete_user_chats(db: AsyncIOMotorDatabase, user_id: str):
    collection = db.get_collection("chats")
    await collection.delete_many({"user_id": user_id})
