import asyncio
import logging
import os
import sys

import stripe

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.users import Users
from db_dependencies import Db
from resolver import Resolver

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

stripe.api_key = os.getenv("STRIPE_API_KEY")


async def main():
    resolver = Resolver()
    db = await resolver.resolve(Db)

    users = db.query(Users).filter(Users.customer_id.isnot(None)).all()

    for user in users:
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=user.customer_id, type="card"
            )

            has_card = len(payment_methods.data) > 0

            if has_card:
                logger.info(f"У пользователя {user.id} найдены карты:")
                for card in payment_methods.data:
                    logger.info(
                        f"  Card: {card.card.brand} ****{card.card.last4} exp: {card.card.exp_month}/{card.card.exp_year}"
                    )
            else:
                logger.info(f"У пользователя {user.id} карт не найдено")

            user.has_credit_card = has_card

        except Exception as e:
            logger.error(f"Ошибка при обработке пользователя {user.id}: {e}")

    db.commit()
    logger.info("Обновление завершено.")


if __name__ == "__main__":
    asyncio.run(main())
