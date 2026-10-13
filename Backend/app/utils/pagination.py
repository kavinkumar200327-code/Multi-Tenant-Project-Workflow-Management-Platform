def calculate_offset(page: int, page_size: int) -> int:

    if page < 1:
        raise ValueError("Page must be greater than or equal to 1.")

    if page_size < 1:
        raise ValueError("Page size must be greater than or equal to 1.")

    return (page - 1) * page_size


def calculate_total_pages(total_items: int, page_size: int) -> int:

    if page_size < 1:
        raise ValueError("Page size must be greater than or equal to 1.")

    if total_items <= 0:
        return 0

    return (total_items + page_size - 1) // page_size


def has_next_page(
    current_page: int,
    page_size: int,
    total_items: int,
) -> bool:

    total_pages = calculate_total_pages(
        total_items=total_items,
        page_size=page_size,
    )

    return current_page < total_pages


def has_previous_page(current_page: int) -> bool:

    return current_page > 1