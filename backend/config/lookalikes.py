from config.util import get_int_env, try_get_int_env

class LookalikesConfig:
    """
    Configuration for lookalikes generation scripts

    Check lookalikes/filler for more details
    """
    BULK_SIZE = get_int_env("LOOKALIKE_BULK_SIZE")
    """
    How big should one batch of lookalikes be, usual values are at around 1mil
    """
    THREAD_COUNT = get_int_env("LOOKALIKE_THREAD_COUNT")
    """
    How many threads to use for parallel lookalikes processing
    """
    LOOKALIKE_MAX_SIZE = try_get_int_env("LOOKALIKE_MAX_SIZE")
    """
    How many rows to process at most. Useful when debugging on localhost/dev. 
    """