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

    def init_sse_events(self, token):
        result = self.verify_token(token)
        if result['status'] == VerifyToken.SUCCESS:
            queue_name = f'sse_events_{str(result["user"].id)}'

            rmq_conn = RabbitMQConnectionSingleton.get_connection()
            channel = rmq_conn.channel()

            queue = channel.queue_declare(
                queue=queue_name,
                auto_delete=True,
                exclusive=True
            )

            try:
                for method_frame, properties, body in channel.consume(queue_name):
                    message_json = json.loads(body)
                    channel.basic_ack(method_frame.delivery_tag)
                    yield json.dumps(message_json)
                    channel.close()
            except Exception as err:
                channel.close()
                print('SSE Exception')
                raise Exception("Error occurred") from err
            finally:
                try:
                    print('SSE finally')
                    channel.close()
                except Exception as close_err:
                    channel.close()
                    print(f"Error closing channel: {close_err}")
