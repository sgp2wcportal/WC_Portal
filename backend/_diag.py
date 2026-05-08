"""Diagnostic — inspects DB and exercises the live API end-to-end."""
import os, sqlite3, json, urllib.request, urllib.error

DB = os.path.join(os.path.dirname(__file__), 'society.db')
BASE = 'http://localhost:8000'


def show_recent():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    print('--- LATEST 5 SUBSCRIPTIONS ---')
    for r in cur.execute(
        'SELECT created_at, owner_name, tower, unit_number FROM subscriptions ORDER BY created_at DESC LIMIT 5'
    ):
        print(r)
    print('\n--- LATEST 5 DONATIONS ---')
    for r in cur.execute(
        'SELECT created_at, donor_name, tower, unit_number FROM donations ORDER BY created_at DESC LIMIT 5'
    ):
        print(r)


def http(method, path, body=None, token=None):
    req = urllib.request.Request(BASE + path, method=method)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header('Content-Type', 'application/json')
    else:
        data = None
    try:
        with urllib.request.urlopen(req, data=data, timeout=5) as r:
            return r.status, json.loads(r.read().decode() or 'null')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors='replace')


def main():
    print('=== BEFORE TEST ===')
    show_recent()

    # Login as admin
    print('\n=== LOGIN ===')
    code, body = http('POST', '/api/auth/login', {'username': 'admin', 'password': 'admin123'})
    print(code, body if isinstance(body, str) else list(body.keys()) if body else None)
    if code != 200:
        return
    token = body['access_token']

    # Create subscription
    print('\n=== POST /api/subscriptions/ ===')
    sub_payload = {
        'owner_name': 'DIAG TEST', 'contact_number': '9999999999', 'email': 'diag@test.local',
        'tower': 'Phoenix', 'unit_number': '707', 'subscription_amount': 1234,
        'family_members': 2, 'is_rented': False,
    }
    code, body = http('POST', '/api/subscriptions/', sub_payload, token)
    print(code, body)

    # Create donation
    print('\n=== POST /api/donations/ ===')
    don_payload = {
        'donor_name': 'DIAG DONOR', 'donor_email': 'donor@test.local', 'donor_phone': '8888888888',
        'tower': 'Atlas', 'unit_number': '404', 'amount': 555, 'donation_type': 'Donation',
        'description': 'diag',
    }
    code, body = http('POST', '/api/donations/', don_payload, token)
    print(code, body)

    print('\n=== AFTER TEST ===')
    show_recent()


if __name__ == '__main__':
    main()
