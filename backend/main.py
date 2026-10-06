import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from database import engine, Base, get_db
import models
import schemas
import auth
from websocket_manager import manager

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Signal Messenger API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static directory for uploaded attachments
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


# --- AUTH ENDPOINTS ---

@app.post("/api/auth/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username or phone exists
    existing = db.query(models.User).filter(
        or_(models.User.username == user_in.username, models.User.phone == user_in.phone)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or phone number already registered")
    
    avatar = user_in.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}"
    user = models.User(
        username=user_in.username,
        phone=user_in.phone,
        display_name=user_in.display_name,
        avatar_url=avatar,
        is_online=True,
        last_seen=datetime.datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    # Identifier can be phone or username
    user = db.query(models.User).filter(
        or_(models.User.username == login_in.identifier, models.User.phone == login_in.identifier)
    ).first()
    
    if not user:
        # For seamless mock onboarding, if user doesn't exist, create a user automatically with phone/username
        user = models.User(
            username=login_in.identifier.lower().replace(" ", "_"),
            phone=login_in.identifier if login_in.identifier.startswith("+") else f"+1555{int(datetime.datetime.utcnow().timestamp()) % 10000000:07d}",
            display_name=login_in.identifier.capitalize(),
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={login_in.identifier}",
            is_online=True,
            last_seen=datetime.datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.is_online = True
        user.last_seen = datetime.datetime.utcnow()
        db.commit()

    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/api/auth/update-profile", response_model=schemas.UserResponse)
def update_profile(
    update_in: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if update_in.display_name:
        current_user.display_name = update_in.display_name
    if update_in.avatar_url is not None:
        current_user.avatar_url = update_in.avatar_url
    if update_in.about is not None:
        current_user.about = update_in.about

    db.commit()
    db.refresh(current_user)
    return current_user


# --- USERS & CONTACTS ENDPOINTS ---

@app.get("/api/users/search", response_model=List[schemas.UserResponse])
def search_users(
    q: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not q:
        return []
    users = db.query(models.User).filter(
        and_(
            models.User.id != current_user.id,
            or_(
                models.User.username.ilike(f"%{q}%"),
                models.User.display_name.ilike(f"%{q}%"),
                models.User.phone.ilike(f"%{q}%")
            )
        )
    ).limit(20).all()
    return users

@app.get("/api/contacts", response_model=List[schemas.ContactResponse])
def get_contacts(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contacts = db.query(models.Contact).filter(models.Contact.user_id == current_user.id).all()
    return contacts

@app.post("/api/contacts", response_model=schemas.ContactResponse)
def add_contact(
    contact_in: schemas.ContactCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    target = db.query(models.User).filter(
        or_(models.User.username == contact_in.identifier, models.User.phone == contact_in.identifier)
    ).first()

    if not target:
        raise HTTPException(status_code=44, detail="User not found with provided phone or username")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as contact")

    existing = db.query(models.Contact).filter(
        and_(models.Contact.user_id == current_user.id, models.Contact.contact_user_id == target.id)
    ).first()
    if existing:
        return existing

    new_contact = models.Contact(
        user_id=current_user.id,
        contact_user_id=target.id,
        nickname=contact_in.nickname
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact


# --- CONVERSATION ENDPOINTS ---

def format_conversation_response(conv: models.Conversation, current_user_id: int, db: Session) -> dict:
    # Cleanup expired messages for disappearing messages feature
    now = datetime.datetime.utcnow()
    db.query(models.Message).filter(
        and_(
            models.Message.conversation_id == conv.id,
            models.Message.expires_at != None,
            models.Message.expires_at <= now
        )
    ).delete(synchronize_session=False)
    db.commit()

    # Get last message
    last_msg = db.query(models.Message).filter(
        models.Message.conversation_id == conv.id
    ).order_by(desc(models.Message.created_at)).first()

    # Get participant record for current_user
    my_part = db.query(models.ConversationParticipant).filter(
        and_(
            models.ConversationParticipant.conversation_id == conv.id,
            models.ConversationParticipant.user_id == current_user_id
        )
    ).first()

    # Unread count
    unread_count = 0
    if my_part and my_part.last_read_message_id:
        unread_count = db.query(models.Message).filter(
            and_(
                models.Message.conversation_id == conv.id,
                models.Message.id > my_part.last_read_message_id,
                models.Message.sender_id != current_user_id
            )
        ).count()
    elif my_part:
        unread_count = db.query(models.Message).filter(
            and_(
                models.Message.conversation_id == conv.id,
                models.Message.sender_id != current_user_id
            )
        ).count()

    # Format direct chat name/avatar from opposing user if direct
    conv_dict = {
        "id": conv.id,
        "type": conv.type,
        "name": conv.name,
        "avatar_url": conv.avatar_url,
        "disappearing_timer": conv.disappearing_timer,
        "created_by_id": conv.created_by_id,
        "participants": conv.participants,
        "last_message": last_msg,
        "unread_count": unread_count,
        "updated_at": conv.updated_at,
        "created_at": conv.created_at,
    }

    if conv.type == "direct":
        other_part = next((p for p in conv.participants if p.user_id != current_user_id), None)
        if other_part:
            conv_dict["name"] = other_part.user.display_name
            conv_dict["avatar_url"] = other_part.user.avatar_url

    return conv_dict

@app.get("/api/conversations", response_model=List[schemas.ConversationResponse])
def get_conversations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Find all conversations current_user participates in
    parts = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.user_id == current_user.id
    ).all()
    conv_ids = [p.conversation_id for p in parts]

    conversations = db.query(models.Conversation).filter(
        models.Conversation.id.in_(conv_ids)
    ).order_by(desc(models.Conversation.updated_at)).all()

    res = [format_conversation_response(c, current_user.id, db) for c in conversations]
    return res

@app.post("/api/conversations/direct", response_model=schemas.ConversationResponse)
def create_or_get_direct_chat(
    data: schemas.DirectChatCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    target_user = db.query(models.User).filter(models.User.id == data.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check if a direct conversation already exists between current_user and target_user
    my_conv_ids = [p.conversation_id for p in db.query(models.ConversationParticipant).filter_by(user_id=current_user.id).all()]
    existing_conv = db.query(models.Conversation).join(models.ConversationParticipant).filter(
        and_(
            models.Conversation.type == "direct",
            models.Conversation.id.in_(my_conv_ids),
            models.ConversationParticipant.user_id == data.target_user_id
        )
    ).first()

    if existing_conv:
        return format_conversation_response(existing_conv, current_user.id, db)

    # Create new direct conversation
    new_conv = models.Conversation(
        type="direct",
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    p1 = models.ConversationParticipant(conversation_id=new_conv.id, user_id=current_user.id, role="member")
    p2 = models.ConversationParticipant(conversation_id=new_conv.id, user_id=data.target_user_id, role="member")
    db.add_all([p1, p2])
    db.commit()
    db.refresh(new_conv)

    return format_conversation_response(new_conv, current_user.id, db)

@app.post("/api/conversations/group", response_model=schemas.ConversationResponse)
async def create_group_chat(
    data: schemas.GroupCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    avatar = data.avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={data.name}"
    new_conv = models.Conversation(
        type="group",
        name=data.name,
        avatar_url=avatar,
        created_by_id=current_user.id,
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    # Add creator as admin
    admin_part = models.ConversationParticipant(
        conversation_id=new_conv.id, user_id=current_user.id, role="admin"
    )
    db.add(admin_part)

    # Add other members
    member_ids = set(data.participant_ids) - {current_user.id}
    for uid in member_ids:
        part = models.ConversationParticipant(
            conversation_id=new_conv.id, user_id=uid, role="member"
        )
        db.add(part)
    db.commit()

    # System message
    sys_msg = models.Message(
        conversation_id=new_conv.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} created group \"{data.name}\"",
        message_type="system",
        status="read"
    )
    db.add(sys_msg)
    db.commit()

    # Notify WebSocket users
    all_uids = [current_user.id] + list(member_ids)
    await manager.broadcast_to_users({
        "type": "conversation_created",
        "conversation_id": new_conv.id
    }, all_uids)

    return format_conversation_response(new_conv, current_user.id, db)

@app.put("/api/conversations/{conv_id}/timer", response_model=schemas.ConversationResponse)
async def update_disappearing_timer(
    conv_id: int,
    timer_data: schemas.ConversationTimerUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.disappearing_timer = timer_data.disappearing_timer
    conv.updated_at = datetime.datetime.utcnow()
    db.commit()

    # Add system message
    timer_str = "off" if timer_data.disappearing_timer == 0 else f"{timer_data.disappearing_timer} seconds"
    if timer_data.disappearing_timer == 86400:
        timer_str = "1 day"
    elif timer_data.disappearing_timer == 604800:
        timer_str = "1 week"

    sys_msg = models.Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} set disappearing messages to {timer_str}",
        message_type="system",
        status="read"
    )
    db.add(sys_msg)
    db.commit()

    participant_ids = [p.user_id for p in conv.participants]
    await manager.broadcast_to_users({
        "type": "conversation_update",
        "conversation_id": conv.id,
        "disappearing_timer": conv.disappearing_timer
    }, participant_ids)

    return format_conversation_response(conv, current_user.id, db)

@app.post("/api/conversations/{conv_id}/members", response_model=schemas.ConversationResponse)
async def add_group_member(
    conv_id: int,
    member_data: schemas.AddGroupMember,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conv or conv.type != "group":
        raise HTTPException(status_code=400, detail="Invalid group conversation")

    # Check if user already in group
    existing = db.query(models.ConversationParticipant).filter_by(
        conversation_id=conv_id, user_id=member_data.user_id
    ).first()

    if not existing:
        new_part = models.ConversationParticipant(
            conversation_id=conv_id, user_id=member_data.user_id, role="member"
        )
        db.add(new_part)
        
        target_user = db.query(models.User).filter_by(id=member_data.user_id).first()
        sys_msg = models.Message(
            conversation_id=conv.id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} added {target_user.display_name if target_user else 'a member'}",
            message_type="system",
            status="read"
        )
        db.add(sys_msg)
        conv.updated_at = datetime.datetime.utcnow()
        db.commit()

    participant_ids = [p.user_id for p in conv.participants]
    await manager.broadcast_to_users({
        "type": "participant_change",
        "conversation_id": conv_id,
        "action": "added",
        "user_id": member_data.user_id
    }, participant_ids)

    return format_conversation_response(conv, current_user.id, db)

@app.delete("/api/conversations/{conv_id}/members/{user_id}", response_model=schemas.ConversationResponse)
async def remove_group_member(
    conv_id: int,
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conv or conv.type != "group":
        raise HTTPException(status_code=400, detail="Invalid group conversation")

    target_part = db.query(models.ConversationParticipant).filter_by(
        conversation_id=conv_id, user_id=user_id
    ).first()

    if target_part:
        target_user = db.query(models.User).filter_by(id=user_id).first()
        db.delete(target_part)
        
        action_text = "left the group" if user_id == current_user.id else f"removed {target_user.display_name if target_user else 'a member'}"
        sys_msg = models.Message(
            conversation_id=conv.id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} {action_text}",
            message_type="system",
            status="read"
        )
        db.add(sys_msg)
        conv.updated_at = datetime.datetime.utcnow()
        db.commit()

    participant_ids = [p.user_id for p in conv.participants] + [user_id]
    await manager.broadcast_to_users({
        "type": "participant_change",
        "conversation_id": conv_id,
        "action": "removed",
        "user_id": user_id
    }, participant_ids)

    return format_conversation_response(conv, current_user.id, db)


# --- MESSAGE ENDPOINTS ---

@app.get("/api/conversations/{conv_id}/messages", response_model=List[schemas.MessageResponse])
def get_messages(
    conv_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify participant
    part = db.query(models.ConversationParticipant).filter_by(
        conversation_id=conv_id, user_id=current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    # Clean up expired messages
    now = datetime.datetime.utcnow()
    db.query(models.Message).filter(
        and_(
            models.Message.conversation_id == conv_id,
            models.Message.expires_at != None,
            models.Message.expires_at <= now
        )
    ).delete(synchronize_session=False)
    db.commit()

    messages = db.query(models.Message).filter(
        models.Message.conversation_id == conv_id
    ).order_by(models.Message.created_at.asc()).all()

    # Update last_read_message_id if messages exist
    if messages:
        part.last_read_message_id = messages[-1].id
        db.commit()

    # Transform messages to populate reactions user_name & quoted reply
    res = []
    for m in messages:
        reactions_formatted = []
        for r in m.reactions:
            reactions_formatted.append({
                "id": r.id,
                "message_id": r.message_id,
                "user_id": r.user_id,
                "emoji": r.emoji,
                "user_name": r.user.display_name if r.user else "User",
                "created_at": r.created_at
            })

        reply_to_formatted = None
        if m.reply_to:
            reply_to_formatted = {
                "id": m.reply_to.id,
                "sender_id": m.reply_to.sender_id,
                "sender_name": m.reply_to.sender.display_name if m.reply_to.sender else "User",
                "content": m.reply_to.content,
                "message_type": m.reply_to.message_type
            }

        res.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "sender": m.sender,
            "content": m.content,
            "message_type": m.message_type,
            "media_url": m.media_url,
            "media_filename": m.media_filename,
            "reply_to_id": m.reply_to_id,
            "reply_to": reply_to_formatted,
            "status": m.status,
            "is_encrypted": m.is_encrypted,
            "expires_at": m.expires_at,
            "reactions": reactions_formatted,
            "created_at": m.created_at
        })

    return res

@app.post("/api/conversations/{conv_id}/messages", response_model=schemas.MessageResponse)
async def send_message(
    conv_id: int,
    msg_in: schemas.MessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    expires_at = None
    if conv.disappearing_timer > 0:
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=conv.disappearing_timer)

    message = models.Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=msg_in.content,
        message_type=msg_in.message_type or "text",
        media_url=msg_in.media_url,
        media_filename=msg_in.media_filename,
        reply_to_id=msg_in.reply_to_id,
        status="sent",
        expires_at=expires_at,
        created_at=datetime.datetime.utcnow()
    )
    db.add(message)
    
    # Update conversation updated_at
    conv.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(message)

    # Format response
    reply_to_formatted = None
    if message.reply_to:
        reply_to_formatted = {
            "id": message.reply_to.id,
            "sender_id": message.reply_to.sender_id,
            "sender_name": message.reply_to.sender.display_name if message.reply_to.sender else "User",
            "content": message.reply_to.content,
            "message_type": message.reply_to.message_type
        }

    res_data = {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "sender": message.sender,
        "content": message.content,
        "message_type": message.message_type,
        "media_url": message.media_url,
        "media_filename": message.media_filename,
        "reply_to_id": message.reply_to_id,
        "reply_to": reply_to_formatted,
        "status": message.status,
        "is_encrypted": message.is_encrypted,
        "expires_at": message.expires_at,
        "reactions": [],
        "created_at": message.created_at
    }

    # Broadcast via WebSocket
    participant_ids = [p.user_id for p in conv.participants]
    await manager.broadcast_to_users({
        "type": "new_message",
        "message": {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "sender_name": current_user.display_name,
            "sender_avatar": current_user.avatar_url,
            "content": message.content,
            "message_type": message.message_type,
            "media_url": message.media_url,
            "media_filename": message.media_filename,
            "reply_to_id": message.reply_to_id,
            "reply_to": reply_to_formatted,
            "status": message.status,
            "is_encrypted": message.is_encrypted,
            "expires_at": message.expires_at.isoformat() if message.expires_at else None,
            "created_at": message.created_at.isoformat()
        }
    }, participant_ids)

    return res_data

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user)
):
    timestamp = int(datetime.datetime.utcnow().timestamp())
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOADS_DIR, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    url = f"/uploads/{filename}"
    return {"url": url, "filename": file.filename}

@app.post("/api/messages/{msg_id}/reactions")
async def toggle_reaction(
    msg_id: int,
    rx_in: schemas.ReactionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(models.Message).filter(models.Message.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    existing = db.query(models.MessageReaction).filter_by(
        message_id=msg_id, user_id=current_user.id, emoji=rx_in.emoji
    ).first()

    action = "added"
    if existing:
        db.delete(existing)
        action = "removed"
    else:
        new_rx = models.MessageReaction(
            message_id=msg_id, user_id=current_user.id, emoji=rx_in.emoji
        )
        db.add(new_rx)
    db.commit()

    conv = db.query(models.Conversation).filter_by(id=msg.conversation_id).first()
    if conv:
        participant_ids = [p.user_id for p in conv.participants]
        await manager.broadcast_to_users({
            "type": "reaction",
            "message_id": msg_id,
            "conversation_id": msg.conversation_id,
            "user_id": current_user.id,
            "user_name": current_user.display_name,
            "emoji": rx_in.emoji,
            "action": action
        }, participant_ids)

    return {"status": "ok", "action": action}

@app.post("/api/messages/{msg_id}/read")
async def mark_message_read(
    msg_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(models.Message).filter(models.Message.id == msg_id).first()
    if not msg:
        return {"status": "ok"}

    if msg.sender_id != current_user.id and msg.status != "read":
        msg.status = "read"
        db.commit()

        conv = db.query(models.Conversation).filter_by(id=msg.conversation_id).first()
        if conv:
            participant_ids = [p.user_id for p in conv.participants]
            await manager.broadcast_to_users({
                "type": "receipt",
                "message_id": msg_id,
                "conversation_id": msg.conversation_id,
                "status": "read",
                "user_id": current_user.id
            }, participant_ids)

    return {"status": "ok"}


# --- WEBSOCKET ROUTE ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(user_id, websocket)
    db = SessionLocal()

    # Update online status
    u = db.query(models.User).filter_by(id=user_id).first()
    if u:
        u.is_online = True
        u.last_seen = datetime.datetime.utcnow()
        db.commit()

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = auth.json.loads(data_text)
                msg_type = data.get("type")

                if msg_type == "typing":
                    conv_id = data.get("conversation_id")
                    is_typing = data.get("is_typing", False)
                    conv = db.query(models.Conversation).filter_by(id=conv_id).first()
                    if conv:
                        target_uids = [p.user_id for p in conv.participants if p.user_id != user_id]
                        await manager.broadcast_to_users({
                            "type": "typing",
                            "conversation_id": conv_id,
                            "user_id": user_id,
                            "user_name": u.display_name if u else "Someone",
                            "is_typing": is_typing
                        }, target_uids)

                elif msg_type == "ping":
                    await websocket.send_text(auth.json.dumps({"type": "pong"}))

            except Exception as e:
                pass

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        if u:
            u.is_online = False
            u.last_seen = datetime.datetime.utcnow()
            db.commit()
    finally:
        db.close()
