import json
from config.rmq_connection import RabbitMQConnectionSingleton
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

            rmq_conn = await RabbitMQConnectionSingleton.get_connection()
            channel = await rmq_conn.channel()

            queue = await channel.declare_queue(
                name=queue_name,
                auto_delete=True,
                exclusive=True
            )

            try:
                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        message_json = json.dumps(json.loads(message.body))
                        await message.ack()
                        yield message_json
                print('Some strange place executed')
            except Exception as err:
                print('SSE Exception')
                raise Exception("Error occurred") from err
            finally:
                try:
                    print('SSE finally')
                    await channel.close()
                except Exception as close_err:
                    print(f"Error closing channel: {close_err}")
