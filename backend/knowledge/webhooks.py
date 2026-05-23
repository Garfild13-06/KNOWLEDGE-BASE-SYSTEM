import hashlib
import hmac
import json

import requests

from .models import WebhookSubscription


def dispatch_webhook(organization, event, payload):
    subs = WebhookSubscription.objects.filter(
        organization=organization,
        is_active=True,
    )
    body = json.dumps({'event': event, 'payload': payload}, default=str)
    for sub in subs:
        events = sub.events or []
        if events and event not in events:
            continue
        headers = {'Content-Type': 'application/json'}
        if sub.secret:
            signature = hmac.new(
                sub.secret.encode(),
                body.encode(),
                hashlib.sha256,
            ).hexdigest()
            headers['X-KB-Signature'] = signature
        try:
            requests.post(sub.url, data=body, headers=headers, timeout=10)
        except requests.RequestException:
            continue
