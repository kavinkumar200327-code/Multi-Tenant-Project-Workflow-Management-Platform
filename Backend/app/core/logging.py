import logging
import sys

LOGGER_NAME = "multi_tenant_workflow"


def setup_logging() -> None:

    logger = logging.getLogger()

    if logger.handlers:
        return

    logger.setLevel(logging.INFO)

    console_handler = logging.StreamHandler(sys.stdout)

    console_handler.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    console_handler.setFormatter(formatter)

    logger.addHandler(console_handler)


def get_logger(name: str = LOGGER_NAME) -> logging.Logger:

    return logging.getLogger(name)