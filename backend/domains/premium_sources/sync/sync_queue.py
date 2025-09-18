from collections.abc import Awaitable, Callable
import logging
from typing import Generic, TypeVar
import asyncio
from aio_pika import Message
from aio_pika.abc import AbstractIncomingMessage, AbstractQueue
from pydantic import BaseModel
from config.rmq_connection import RabbitMQConnection
from db_dependencies import Rmq
from domains.premium_sources.sync.schemas import UnprocessedPremiumSourceBatch
from resolver import injectable
from domains.premium_sources.sync.config import QUEUE_PREFETCH


logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class QueueService(Generic[T]):
    queue_name: str | None = None
    model_type: type[T] | None = None
    queue: AbstractQueue | None = None

    def __init__(self, rmq: Rmq) -> None:
        connection, channel = rmq
        self.connection = connection
        self.channel = channel

        if self.queue_name is None:
            raise Exception(
                f"Queue name is not set for {self.__class__.__name__}"
            )

        if self.model_type is None:
            raise Exception(
                f"Model type is not set for {self.__class__.__name__}"
            )

    async def init(self):
        self.queue = await self.declare_queue()

    def _get_queue_name(self):
        if self.queue_name is None:
            raise Exception(
                f"Queue name is not set for {self.__class__.__name__}"
            )
        return self.queue_name

    def _get_queue(self):
        if self.queue is None:
            raise Exception(f"Queue {self.queue_name} was not initialized")
        return self.queue

    def _get_model_type(self):
        if self.model_type is None:
            raise Exception(
                f"Model type is not set for {self.__class__.__name__}"
            )
        return self.model_type

    async def declare_queue(self) -> AbstractQueue:
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=QUEUE_PREFETCH)

        queue = await channel.declare_queue(
            name=self.queue_name,
            durable=True,
        )

        return queue

    async def publish(self, batch: T) -> None:
        json_bytes = batch.model_dump_json().encode("utf-8")

        message = Message(json_bytes)

        try:
            _ = await self.channel.default_exchange.publish(
                message,
                routing_key=self._get_queue_name(),
            )
        except Exception:
            _ = await self.channel.default_exchange.publish(
                message,
                routing_key=self._get_queue_name(),
            )

    async def consume(
        self,
        handler: Callable[[AbstractIncomingMessage], Awaitable[None]],
        concurrency: int = 8,
    ):
        queue = self._get_queue()
        sem = asyncio.Semaphore(concurrency)
        active_tasks: set[asyncio.Task] = set()

        async def _run_handler(message: AbstractIncomingMessage):
            await sem.acquire()
            try:
                await handler(message)
            except Exception:
                logger.exception("Handler raised an exception")
            finally:
                sem.release()

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                task = asyncio.create_task(_run_handler(message))
                active_tasks.add(task)
                task.add_done_callback(lambda t: active_tasks.discard(t))

        if active_tasks:
            await asyncio.wait(active_tasks)

    async def fetch(self, timeout: int = 60) -> AbstractIncomingMessage:
        """
        raises `aio_pika.QueueEmpty`
        """
        queue = self._get_queue()
        logger.info("fetching message...")
        incoming_message = await queue.get(timeout=timeout)
        await incoming_message.ack()
        return incoming_message

    def parse_message(self, incoming_message: AbstractIncomingMessage) -> T:
        json_bytes = incoming_message.body
        batch = self._get_model_type().model_validate_json(json_bytes)
        return batch


@injectable
class PremiumSourceSyncQueueService(
    QueueService[UnprocessedPremiumSourceBatch]
):
    queue_name = "premium_source_sync_queue"
    model_type = UnprocessedPremiumSourceBatch
