from datetime import datetime

from app.models import BetaNoteBase


class BetaNoteCreate(BetaNoteBase):
    pass


class BetaNoteRead(BetaNoteBase):
    id: int
    created_at: datetime
