from typing import TypedDict
from uuid import UUID

from resolver import injectable
from services.rabbitmq import RabbitmqService


class LookalikesMatchingMessage(TypedDict):
    lookalike_id: str
    user_id: int


@injectable
class RabbitLookalikesMatchingService:
    AUDIENCE_LOOKALIKES_MATCHING = "audience_lookalikes_matching"

    def __init__(self, rabbit: RabbitmqService):
        self.rabbit = rabbit

    async def inform_lookalike_agent(
        self, channel, lookalike_id: UUID, user_id: int
    ):
        message_body = LookalikesMatchingMessage(
            lookalike_id=str(lookalike_id), user_id=user_id
        )

        await self.rabbit.publish_rabbitmq_message_with_channel(
            channel=channel,
            queue_name=self.AUDIENCE_LOOKALIKES_MATCHING,
            message_body=message_body,
        )
