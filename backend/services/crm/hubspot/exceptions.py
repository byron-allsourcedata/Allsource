from .schemas import NewContactCRM


class AddingCRMContact(Exception):
    def __init__(
        self,
        contact: NewContactCRM,
        exception: Exception
    ):
        self.contact = contact
        self.exception = exception

class UpdateContactStatusException(Exception):
    pass