from uuid import UUID


class LookalikeNotFound(Exception):
    def __init__(self, lookalike_id: UUID):
        self.lookalike_id = lookalike_id
        message = f"Lookalike with id {lookalike_id} is not found"
        super().__init__(message)
    