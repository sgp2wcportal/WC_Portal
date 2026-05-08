import logging
import uuid
from datetime import timedelta

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.utils.jwt_handler import create_access_token

log = logging.getLogger(__name__)

# bcrypt with a sane default cost. Existing demo accounts get migrated to hashed
# passwords on first boot via _seed_demo_accounts().
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- Password helpers ----------

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, stored: str) -> bool:
    """Verify a password against the stored value.

    Falls back to a plaintext comparison if the stored value isn't a bcrypt hash
    (e.g. legacy demo seeds before migration). Once verified that way, callers
    are expected to upgrade the stored value to a hash.
    """
    if not stored:
        return False
    if stored.startswith("$2") and len(stored) >= 50:
        try:
            return pwd_context.verify(plain, stored)
        except Exception as exc:
            log.warning("bcrypt verify failed: %s", exc)
            return False
    return plain == stored


# ---------- Registration ----------

class UsernameTaken(Exception):
    pass


class EmailTaken(Exception):
    pass


def register_resident(
    db: Session,
    *,
    username: str,
    password: str,
    name: str,
    email: str,
    contact_number: str,
    tower: str,
    unit_number: str,
    is_rented: bool = False,
    owner_name: str | None = None,
    owner_contact_number: str | None = None,
) -> User:
    username = username.strip()
    email = email.strip().lower()
    if db.query(User).filter(User.username == username).first():
        raise UsernameTaken(username)
    if email and db.query(User).filter(User.email == email).first():
        raise EmailTaken(email)

    user = User(
        id=str(uuid.uuid4()),
        username=username,
        password=hash_password(password),
        role=UserRole.USER,
        name=name.strip(),
        email=email,
        contact_number=contact_number.strip(),
        tower=tower.strip(),
        unit_number=unit_number.strip(),
        is_rented=bool(is_rented),
        owner_name=(owner_name or "").strip() or None if is_rented else None,
        owner_contact_number=(owner_contact_number or "").strip() or None if is_rented else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------- Authentication ----------

# Used as a one-time fallback if the users table is empty. After first boot the
# accounts live in the DB and this dict is no longer consulted.
HARDCODED_USERS = {
    "admin":   {"password": "admin123",   "role": UserRole.ADMIN},
    "user":    {"password": "user123",    "role": UserRole.USER},
    "generic": {"password": "generic123", "role": UserRole.GENERIC},
}


def authenticate_user(username: str, password: str, db: Session) -> User | None:
    """Look up user in DB and verify password (bcrypt or legacy plaintext)."""
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        return None
    if not verify_password(password, db_user.password):
        return None
    # Upgrade stored password to a bcrypt hash if it was still plaintext
    if not (db_user.password or "").startswith("$2"):
        db_user.password = hash_password(password)
        db.commit()
        db.refresh(db_user)
    return db_user


def create_access_token_for_user(user: User) -> str:
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days for residents
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    return create_access_token(
        data={"sub": user.username, "role": role_value},
        expires_delta=access_token_expires,
    )


# ---------- Profile management ----------

def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def update_user_profile(
    db: Session,
    user: User,
    *,
    name: str | None = None,
    email: str | None = None,
    contact_number: str | None = None,
    tower: str | None = None,
    unit_number: str | None = None,
    is_rented: bool | None = None,
    owner_name: str | None = None,
    owner_contact_number: str | None = None,
) -> User:
    if email is not None:
        cleaned = email.strip().lower()
        existing = db.query(User).filter(User.email == cleaned, User.id != user.id).first()
        if existing:
            raise EmailTaken(cleaned)
        user.email = cleaned
    if name is not None:
        user.name = name.strip()
    if contact_number is not None:
        user.contact_number = contact_number.strip()
    if tower is not None:
        user.tower = tower.strip()
    if unit_number is not None:
        user.unit_number = unit_number.strip()
    if is_rented is not None:
        user.is_rented = bool(is_rented)
        if not is_rented:
            user.owner_name = None
            user.owner_contact_number = None
    if owner_name is not None and (is_rented or user.is_rented):
        user.owner_name = owner_name.strip() or None
    if owner_contact_number is not None and (is_rented or user.is_rented):
        user.owner_contact_number = owner_contact_number.strip() or None
    db.commit()
    db.refresh(user)
    return user


class CurrentPasswordWrong(Exception):
    pass


def change_user_password(db: Session, user: User, *, current_password: str, new_password: str) -> User:
    if not verify_password(current_password, user.password):
        raise CurrentPasswordWrong()
    user.password = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user


# ---------- Demo account seeding ----------

def seed_demo_accounts(db: Session) -> None:
    """Ensure admin/user/generic exist with their default passwords (hashed)."""
    for username, cred in HARDCODED_USERS.items():
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            # If still plaintext, upgrade to a hash so future logins go through bcrypt
            if existing.password and not existing.password.startswith("$2"):
                existing.password = hash_password(existing.password)
            continue
        db.add(User(
            id=str(uuid.uuid4()),
            username=username,
            password=hash_password(cred["password"]),
            role=cred["role"],
        ))
    db.commit()
