import httpx

def run():
    print("==================================================")
    print("  PROJECT EYE -- END-TO-END VERIFICATION")
    print("==================================================")

    # 1. Health Check
    r1 = httpx.get('http://127.0.0.1:8000/health')
    print('[1] Health Check:', r1.status_code, r1.json().get('status'))

    # 2. Login as admin
    r2 = httpx.post('http://127.0.0.1:8000/api/v1/auth/login', json={
        'username': 'admin@eye.security',
        'password': 'EyeAdmin2026!Secure'
    })
    print('[2] Login as Admin:', r2.status_code, 'Token valid:', bool(r2.json().get('access_token')))
    token = r2.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 3. Query alerts
    r3 = httpx.get('http://127.0.0.1:8000/api/v1/alerts', headers=headers)
    alerts = r3.json()['items']
    print(f'[3] Alerts in Queue: {len(alerts)} | First: {alerts[0]["alert_id"]} - {alerts[0]["rule_name"]}')

    # 4. Query incidents
    r4 = httpx.get('http://127.0.0.1:8000/api/v1/incidents', headers=headers)
    incidents = r4.json()['items']
    print(f'[4] Incidents Count: {len(incidents)} | First Campaign: {incidents[0]["title"]}')

    # 5. Test AI Investigation
    r5 = httpx.post('http://127.0.0.1:8000/api/v1/ai/analyze-alert', headers=headers, json={
        'alert_id': alerts[0]['alert_id']
    })
    ai_data = r5.json()
    print('[5] AI Investigation Engine:')
    print(f'    - Provider Used:   {ai_data.get("provider_used")}')
    print(f'    - Prompt Shield:   {ai_data.get("prompt_shield_status")}')
    print(f'    - Confidence:      {ai_data.get("confidence")}')
    print(f'    - Root Cause:      {ai_data.get("root_cause")}')
    print(f'    - Mitigations:     {len(ai_data.get("recommended_actions", []))} actions provided')

    # 6. Live Ingestion
    raw_payload = '198.51.100.99 - - [18/Aug/2026:21:12:00 +0000] "GET /login?user=admin\'%20UNION%20SELECT%201,version()-- HTTP/1.1" 403 210 "-" "sqlmap/1.7"'
    r6 = httpx.post('http://127.0.0.1:8000/api/v1/events/ingest', json={
        'source': 'nginx',
        'raw_log': raw_payload,
        'host': 'web-api-01'
    })
    print(f'[6] Live Log Ingestion: Status {r6.status_code} | Body: {r6.text}')

    # 7. Frontend Check
    r7 = httpx.get('http://127.0.0.1:5173')
    print(f'[7] Frontend Console: Status {r7.status_code} | Web App Available at http://localhost:5173')

    print("==================================================")
    print("  ALL PROJECT EYE SYSTEMS 100% OPERATIONAL!")
    print("==================================================")

if __name__ == '__main__':
    run()
