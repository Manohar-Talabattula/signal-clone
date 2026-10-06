import datetime
from database import engine, SessionLocal, Base
import models

def seed_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Create Users
    users_data = [
        {
            "username": "alice",
            "phone": "+15550101",
            "display_name": "Alice Vance",
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Alice",
            "about": "🔒 Privacy is a fundamental right.",
            "is_online": True,
            "last_seen": datetime.datetime.utcnow()
        },
        {
            "username": "bob",
            "phone": "+15550102",
            "display_name": "Bob Smith",
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Bob",
            "about": "Designing beautiful & secure UI 🎨",
            "is_online": True,
            "last_seen": datetime.datetime.utcnow()
        },
        {
            "username": "charlie",
            "phone": "+15550103",
            "display_name": "Charlie Brown",
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Charlie",
            "about": "Cryptography & Double Ratchet fan 🔑",
            "is_online": False,
            "last_seen": datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
        },
        {
            "username": "dana",
            "phone": "+15550104",
            "display_name": "Dana Scully",
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Dana",
            "about": "Investigating zero-knowledge proofs",
            "is_online": True,
            "last_seen": datetime.datetime.utcnow()
        },
        {
            "username": "eve",
            "phone": "+15550105",
            "display_name": "Eve Hacker",
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Eve",
            "about": "Testing edge cases & system security 🛡️",
            "is_online": False,
            "last_seen": datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        }
    ]

    users = []
    for u_data in users_data:
        u = models.User(**u_data)
        db.add(u)
        users.append(u)
    db.commit()

    # Re-fetch users for IDs
    alice = db.query(models.User).filter_by(username="alice").first()
    bob = db.query(models.User).filter_by(username="bob").first()
    charlie = db.query(models.User).filter_by(username="charlie").first()
    dana = db.query(models.User).filter_by(username="dana").first()
    eve = db.query(models.User).filter_by(username="eve").first()

    # Add Contacts for Alice
    contacts_data = [
        models.Contact(user_id=alice.id, contact_user_id=bob.id, nickname="Bob (Designer)"),
        models.Contact(user_id=alice.id, contact_user_id=charlie.id, nickname="Charlie (Sec)"),
        models.Contact(user_id=alice.id, contact_user_id=dana.id, nickname="Dana (Arch)"),
        models.Contact(user_id=alice.id, contact_user_id=eve.id),
        models.Contact(user_id=bob.id, contact_user_id=alice.id),
        models.Contact(user_id=bob.id, contact_user_id=charlie.id),
        models.Contact(user_id=charlie.id, contact_user_id=alice.id),
    ]
    db.add_all(contacts_data)
    db.commit()

    # 1. Direct Conversation: Alice & Bob
    conv1 = models.Conversation(
        type="direct",
        disappearing_timer=0,
        updated_at=datetime.datetime.utcnow()
    )
    db.add(conv1)
    db.commit()

    p1 = models.ConversationParticipant(conversation_id=conv1.id, user_id=alice.id, role="member")
    p2 = models.ConversationParticipant(conversation_id=conv1.id, user_id=bob.id, role="member")
    db.add_all([p1, p2])
    db.commit()

    m1 = models.Message(
        conversation_id=conv1.id,
        sender_id=bob.id,
        content="Hey Alice! Did you review the new Signal desktop UI mocks?",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=45)
    )
    m2 = models.Message(
        conversation_id=conv1.id,
        sender_id=alice.id,
        content="Yes Bob! The message bubble radius and signature Signal blue look super crisp.",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=30)
    )
    m3 = models.Message(
        conversation_id=conv1.id,
        sender_id=bob.id,
        content="Awesome! I also tuned the dark theme contrast for better readability in low light.",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
    )
    m4 = models.Message(
        conversation_id=conv1.id,
        sender_id=alice.id,
        content="Perfect. Real-time WebSocket delivery and read receipts are working smoothly!",
        reply_to_id=None,
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=2)
    )
    db.add_all([m1, m2, m3, m4])
    db.commit()

    # Reactions on m4
    r1 = models.MessageReaction(message_id=m4.id, user_id=bob.id, emoji="👍")
    r2 = models.MessageReaction(message_id=m4.id, user_id=bob.id, emoji="❤️")
    db.add_all([r1, r2])
    db.commit()

    # 2. Group Conversation: "Signal Dev Squad"
    conv_group = models.Conversation(
        type="group",
        name="🚀 Signal Dev Squad",
        avatar_url="https://api.dicebear.com/7.x/identicon/svg?seed=SignalDevSquad",
        disappearing_timer=0,
        created_by_id=alice.id,
        updated_at=datetime.datetime.utcnow()
    )
    db.add(conv_group)
    db.commit()

    gp1 = models.ConversationParticipant(conversation_id=conv_group.id, user_id=alice.id, role="admin")
    gp2 = models.ConversationParticipant(conversation_id=conv_group.id, user_id=bob.id, role="member")
    gp3 = models.ConversationParticipant(conversation_id=conv_group.id, user_id=charlie.id, role="member")
    gp4 = models.ConversationParticipant(conversation_id=conv_group.id, user_id=dana.id, role="member")
    db.add_all([gp1, gp2, gp3, gp4])
    db.commit()

    gm1 = models.Message(
        conversation_id=conv_group.id,
        sender_id=alice.id,
        content="Alice Vance created the group \"🚀 Signal Dev Squad\"",
        message_type="system",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5)
    )
    gm2 = models.Message(
        conversation_id=conv_group.id,
        sender_id=charlie.id,
        content="Welcome team! All client-server communications are configured over secure WebSocket channels.",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=4)
    )
    gm3 = models.Message(
        conversation_id=conv_group.id,
        sender_id=dana.id,
        content="SQLite WAL mode is enabled for super-fast concurrent read/write operations.",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    )
    gm4 = models.Message(
        conversation_id=conv_group.id,
        sender_id=bob.id,
        content="Let's make sure the search filter and member modal work seamlessly.",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
    )
    db.add_all([gm1, gm2, gm3, gm4])
    db.commit()

    # 3. Direct Conversation: Alice & Charlie (With Disappearing Timer set)
    conv_charlie = models.Conversation(
        type="direct",
        disappearing_timer=300, # 5 minutes timer
        updated_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    )
    db.add(conv_charlie)
    db.commit()

    cp1 = models.ConversationParticipant(conversation_id=conv_charlie.id, user_id=alice.id, role="member")
    cp2 = models.ConversationParticipant(conversation_id=conv_charlie.id, user_id=charlie.id, role="member")
    db.add_all([cp1, cp2])
    db.commit()

    cm1 = models.Message(
        conversation_id=conv_charlie.id,
        sender_id=charlie.id,
        content="Charlie Brown set the disappearing message timer to 5 minutes.",
        message_type="system",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
    )
    cm2 = models.Message(
        conversation_id=conv_charlie.id,
        sender_id=charlie.id,
        content="Hey Alice, testing confidential message expiration timer.",
        status="read",
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=5),
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
    )
    db.add_all([cm1, cm2])
    db.commit()

    # 4. Direct Conversation: Alice & Dana (With Attachments)
    conv_dana = models.Conversation(
        type="direct",
        disappearing_timer=0,
        updated_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    )
    db.add(conv_dana)
    db.commit()

    dp1 = models.ConversationParticipant(conversation_id=conv_dana.id, user_id=alice.id, role="member")
    dp2 = models.ConversationParticipant(conversation_id=conv_dana.id, user_id=dana.id, role="member")
    db.add_all([dp1, dp2])
    db.commit()

    dm1 = models.Message(
        conversation_id=conv_dana.id,
        sender_id=dana.id,
        content="Here is the architecture diagram for our Signal service model:",
        message_type="image",
        media_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        media_filename="signal_architecture_diagram.png",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    )
    dm2 = models.Message(
        conversation_id=conv_dana.id,
        sender_id=alice.id,
        content="Looks clean! All modules are completely decoupled and typed.",
        status="read",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=50)
    )
    db.add_all([dm1, dm2])
    db.commit()

    db.close()
    print("Database successfully seeded!")

if __name__ == "__main__":
    seed_db()
