import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    username: str
    phone: str
    display_name: str
    avatar_url: Optional[str] = None
    about: Optional[str] = "Hey there! I am using Signal."

class UserCreate(BaseModel):
    username: str
    phone: str
    display_name: str
    avatar_url: Optional[str] = None
    otp: str = "123456"

class UserLogin(BaseModel):
    identifier: str # Username or Phone
    otp: str = "123456"

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    about: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_online: bool
    last_seen: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Contact Schemas
class ContactCreate(BaseModel):
    identifier: str # Phone or Username of the contact to add
    nickname: Optional[str] = None

class ContactResponse(BaseModel):
    id: int
    contact_user: UserResponse
    nickname: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Message Reaction & Receipt Schemas
class ReactionCreate(BaseModel):
    emoji: str

class ReactionResponse(BaseModel):
    id: int
    message_id: int
    user_id: int
    emoji: str
    user_name: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ReceiptResponse(BaseModel):
    id: int
    message_id: int
    user_id: int
    status: str
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Message Schemas
class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    message_type: Optional[str] = "text" # 'text', 'image', 'file'
    media_url: Optional[str] = None
    media_filename: Optional[str] = None
    reply_to_id: Optional[int] = None

class QuotedMessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    content: str
    message_type: str

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender: UserResponse
    content: str
    message_type: str
    media_url: Optional[str] = None
    media_filename: Optional[str] = None
    reply_to_id: Optional[int] = None
    reply_to: Optional[QuotedMessageResponse] = None
    status: str
    is_encrypted: bool
    expires_at: Optional[datetime.datetime] = None
    reactions: List[ReactionResponse] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Conversation Participant Schema
class ParticipantResponse(BaseModel):
    id: int
    user_id: int
    role: str
    user: UserResponse
    joined_at: datetime.datetime

    class Config:
        from_attributes = True

# Conversation Schemas
class GroupCreate(BaseModel):
    name: str
    participant_ids: List[int]
    avatar_url: Optional[str] = None

class DirectChatCreate(BaseModel):
    target_user_id: int

class ConversationTimerUpdate(BaseModel):
    disappearing_timer: int # 0 for off, or seconds

class ConversationResponse(BaseModel):
    id: int
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    disappearing_timer: int
    created_by_id: Optional[int] = None
    participants: List[ParticipantResponse]
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    updated_at: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AddGroupMember(BaseModel):
    user_id: int

class RemoveGroupMember(BaseModel):
    user_id: int
