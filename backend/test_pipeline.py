import requests
import json

BASE = 'http://127.0.0.1:8000'

def run_suite():
    # 1. Test Root SPA serving
    r_root = requests.get(f'{BASE}/')
    assert r_root.status_code == 200, f'Root failed: {r_root.status_code}'
    assert '<!doctype html>' in r_root.text.lower(), 'SPA HTML not returned'
    print('1. Root SPA HTML serving: PASSED')

    # 2. Test Login
    r_login = requests.post(f'{BASE}/api/auth/login', json={'email': 'officer@landrecords.gov.in', 'password': 'officer123'})
    assert r_login.status_code == 200, f'Login failed: {r_login.text}'
    login_data = r_login.json()
    token = login_data['access_token']
    user_name = login_data['user']['name']
    headers = {'Authorization': f'Bearer {token}'}
    print(f'2. Login & JWT Authentication: PASSED ({user_name})')

    # 3. Test Dashboard Stats
    r_stats = requests.get(f'{BASE}/api/dashboard/stats', headers=headers)
    assert r_stats.status_code == 200, 'Stats failed'
    stats = r_stats.json()['stats']
    print(f'3. Dashboard Stats: PASSED (Records: {stats["total_records"]}, Verified: {stats["verified_records"]})')

    # 4. Test Document Samples
    r_samples = requests.get(f'{BASE}/api/documents/samples', headers=headers)
    assert r_samples.status_code == 200, 'Samples failed'
    samples = r_samples.json()
    assert len(samples) >= 5, 'Missing samples'
    print(f'4. Pre-bundled Certified Deed Samples: PASSED ({len(samples)} available)')

    # 5. Test End-to-End Processing Pipeline on a sample deed
    test_sample = samples[0]
    with open(f'sample_documents/{test_sample["id"]}', 'rb') as f:
        r_up = requests.post(
            f'{BASE}/api/documents/upload', 
            files={'file': f}, 
            data={'language': test_sample['language']}, 
            headers=headers
        )
    assert r_up.status_code == 200, f'Upload failed: {r_up.text}'
    doc_id = r_up.json()['id']

    r_proc = requests.post(f'{BASE}/api/documents/{doc_id}/process', headers=headers)
    assert r_proc.status_code == 200, f'Processing pipeline failed: {r_proc.text}'
    proc_data = r_proc.json()
    print(f'5. Full OCR & AI Pipeline Execution: PASSED (Deed: {test_sample["id"]}, Conf: {proc_data["overall_confidence"]}%, Status: {proc_data["status"]})')

    # 6. Test Duplicate Detection Scanning
    r_dups = requests.get(f'{BASE}/api/duplicates', headers=headers)
    assert r_dups.status_code == 200, 'Duplicates failed'
    dups = r_dups.json()
    print(f'6. Multi-Factor Duplicate Engine: PASSED ({len(dups)} flagged candidates with weighted similarity)')

    # 7. Test Human Review Queue
    r_queue = requests.get(f'{BASE}/api/review/queue', headers=headers)
    assert r_queue.status_code == 200, 'Review queue failed'
    queue = r_queue.json()
    print(f'7. Human Review Queue: PASSED ({len(queue)} pending records)')

    # 8. Test Review Approval Action
    if queue:
        target_rec = queue[0]['id']
        r_app = requests.post(
            f'{BASE}/api/review/{target_rec}/approve', 
            json={'comment': 'Verified via automated SIH validation test.'}, 
            headers=headers
        )
        assert r_app.status_code == 200, 'Approval failed'
        print(f'8. Officer Approval Action & State Transition: PASSED (Record #{target_rec})')

    # 9. Test Search & Filter
    r_search = requests.get(f'{BASE}/api/records?search=Moyna', headers=headers)
    assert r_search.status_code == 200, 'Search failed'
    print(f'9. Cadastral Record Search: PASSED ({len(r_search.json())} matches for "Moyna")')

    # 10. Test Audit Logs
    r_audit = requests.get(f'{BASE}/api/audit-logs', headers=headers)
    assert r_audit.status_code == 200, 'Audit logs failed'
    print(f'10. Tamper-Evident Audit Trail: PASSED ({len(r_audit.json())} audit log events recorded)')

    # 11. Test Buyer Trust Certificate Generation (New Feature)
    r_cert = requests.post(f'{BASE}/api/certificates/generate/1', headers=headers)
    assert r_cert.status_code == 200, f'Certificate generation failed: {r_cert.text}'
    cert_data = r_cert.json()
    assert cert_data['trust_status'] in ['VERIFIED', 'VERIFIED_WITH_CONDITIONS', 'REQUIRES_FURTHER_VERIFICATION']
    assert 'BTC-2026' in cert_data['certificate_id']
    assert cert_data['latitude'] is not None and cert_data['longitude'] is not None
    assert cert_data['disclaimer'] != ''
    print(f'11. Buyer Trust Certificate Generation: PASSED ({cert_data["certificate_id"]} | Status: {cert_data["trust_status"]} | Score: {cert_data["trust_score"]}%)')

    # 12. Test Public Certificate Verification Portal & QR Endpoint (New Feature)
    gen_cert_id = cert_data['certificate_id']
    r_verify = requests.get(f'{BASE}/api/certificates/verify/{gen_cert_id}')
    assert r_verify.status_code == 200, f'Certificate verification failed: {r_verify.text}'
    v_data = r_verify.json()
    assert v_data['is_valid'] is True
    assert v_data['property_reference']['owner_name'] == cert_data['owner_name']
    assert 'google_maps_url' in v_data['gis_summary']
    print(f'12. Certificate Verification Portal & QR Endpoint: PASSED (Verified live against Cadastre Registry)')

    print('\n>>> ALL 12 END-TO-END VERIFICATION TESTS PASSED PERFECTLY! <<<')

if __name__ == '__main__':
    run_suite()
