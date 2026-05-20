"""Module sécurité — auth, mots de passe, tokens, RBAC, rate-limiting.

Sous-modules :
- `passwords` : hash + vérif bcrypt
- `tokens`    : émission + validation JWT
- `rate_limit`: rate-limiter en mémoire (Redis en V2)
- `rbac`      : dépendances FastAPI (current_user, require_permissions, …)
"""

from app.core.security.passwords import hash_password, verify_password
from app.core.security.rate_limit import LoginRateLimiter
from app.core.security.rbac import (
    AuthenticatedUser,
    get_current_user,
    require_permissions,
    require_roles,
    require_scope,
)
from app.core.security.tokens import (
    TokenPayload,
    create_access_token,
    create_refresh_token,
    decode_token,
)

__all__ = [
    "AuthenticatedUser",
    "LoginRateLimiter",
    "TokenPayload",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "get_current_user",
    "hash_password",
    "require_permissions",
    "require_roles",
    "require_scope",
    "verify_password",
]
