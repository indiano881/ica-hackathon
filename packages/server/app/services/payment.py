"""Mock payment capture and refund processing."""

from datetime import datetime, timezone

from ..models.transaction import Transaction, PaymentStatus
from ..models.return_request import ReturnRequest, RefundStatus


def capture_payment(txn: Transaction) -> tuple[PaymentStatus, str]:
    """
    Mock payment capture. In production this would call a payment gateway.
    Returns (status, settled_at).
    """
    print(
        f"[Payment] Capturing {txn.payment.amount} SEK "
        f"for txn {txn.txn_id} via {txn.payment.method}"
    )
    return "captured", datetime.now(timezone.utc).isoformat()


def process_refund(return_req: ReturnRequest) -> RefundStatus:
    """
    Mock refund processing.
    Loyalty credit refunds are instant. Card refunds would go through the gateway.
    """
    print(
        f"[Payment] Processing {return_req.refund.method} refund "
        f"of {return_req.refund.amount} SEK for return {return_req.return_id}"
    )
    return "processed"
