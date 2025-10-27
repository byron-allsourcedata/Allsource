class LiverampError(Exception):
    pass


class PersistenceError(LiverampError):
    pass


class UploadError(LiverampError):
    pass
