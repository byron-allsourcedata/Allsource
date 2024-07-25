import json
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from enums import VerifyToken
from persistence.user_persistence import UserPersistence
from .jwt_service import decode_jwt_data

class SseEventsService:

    def __init__(self, user_persistence_service: UserPersistence):
        self.user_persistence_service = user_persistence_service

    def verify_token(self, token):
        try:
            data = decode_jwt_data(token)
        except:
            return {'status': VerifyToken.INCORRECT_TOKEN}
        check_user_object = self.user_persistence_service.get_user_by_id(data.get('id'))
        if check_user_object:
            return {
                'status': VerifyToken.SUCCESS,
                'user': check_user_object
            }
        return {'status': VerifyToken.INCORRECT_TOKEN}

    async def init_sse_events(self, token):
        result = self.verify_token(token)
        if result['status'] == VerifyToken.SUCCESS:
            queue_name = f'sse_events_{str(result["user"].id)}'

            print(0)
            rmq_connection = RabbitMQConnection()
            print(1)
            connection = await rmq_connection.connect()
            print(2)
            channel = await connection.channel()
            print(3)
            queue = await channel.declare_queue(
                name=queue_name,
                auto_delete=True
            )

            try:
                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        message_json = json.dumps(json.loads(message.body))
                        await message.ack()
                        yield message_json
            except Exception as err:
                print('SSE Exception:', err)
            finally:
                print('SSE finally')
                await rmq_connection.close()
