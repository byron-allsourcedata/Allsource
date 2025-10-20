import logging
import sys
from types import ModuleType


def setup_global_logger(level: int):
    """
    Use setup_logger instead
    """
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def setup_local_logger(logger: logging.Logger, level: int):
    """
    Use setup_logger instead
    """
    handler = logging.StreamHandler()
    handler.setLevel(level)
    formatter = logging.Formatter(
        fmt="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.setLevel(level)
    logger.handlers.clear()
    logger.addHandler(handler)


def setup_logging(
    logger_or_module: logging.Logger | ModuleType, level: int
) -> None:
    """
    Setup logging in bin/scripts

    Usage:
    ```
    setup_logging(logger) # for local logger
    # or
    setup_logging(logging) # for global logging object
    ```
    """
    if isinstance(logger_or_module, logging.Logger):
        setup_local_logger(logger_or_module, level)
    else:
        setup_global_logger(level)


def parse_log_level():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == "DEBUG":
            log_level = logging.DEBUG

    return log_level
