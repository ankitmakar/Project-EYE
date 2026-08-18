import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).parents[1] / "backend"
sys.path.insert(0, str(backend_path))

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal, init_db
from app.models.user import User
from sqlalchemy import select

async def create_admin(email: str, username: str, password: str, full_name: str = "Admin"):
    await init_db()
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where((User.email == email) | (User.username == username)))
        if res.scalar_one_or_none():
            print(f"[!] Error: User with email '{email}' or username '{username}' already exists.")
            return

        user = User(
            email=email,
            username=username,
            full_name=full_name,
            role="admin",
            is_active=True,
            hashed_password=get_password_hash(password)
        )
        db.add(user)
        await db.commit()
        print(f"[✓] Admin user '{username}' ({email}) created successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python create_admin.py <email> <username> <password> [full_name]")
        print("Example: python create_admin.py admin@example.com admin SecurePassword123!")
        sys.exit(1)

    email = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    full_name = sys.argv[4] if len(sys.argv) > 4 else "SOC Admin"
    asyncio.run(create_admin(email, username, password, full_name))
