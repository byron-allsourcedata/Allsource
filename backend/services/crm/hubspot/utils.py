from .schemas import Association


def default_association() -> Association:
    return {
        "types": [
            {
                "associationCategory": "HUBSPOT_DEFINED",
                "associationTypeId": 0
            }
        ],
        "to": {
            "id": "string"
        }
    }

