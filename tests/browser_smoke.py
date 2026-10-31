"""End-to-end checks for the local Mellom app; run after npm run dev.
Requires Python Playwright and Chromium, with no npm/browser downloads.
"""
import json
import os
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('MELLOM_TEST_URL', 'http://127.0.0.1:5173')
ARGUMENT = ('Flexible working arrangements can give employees more autonomy over their schedules. '
            'For example, a parent can start earlier and collect a child from school without rushing. '
            'However, there is a trade-off between independence and opportunities for spontaneous collaboration. '
            'A team should therefore agree on shared hours and explain how it will accommodate different needs. '
            'This approach offers practical freedom while protecting the relationships that help colleagues solve difficult problems together.')
STORY = ('Last year, I struggled to focus in a noisy office. Every afternoon, I left important tasks unfinished. '
         'One day, I asked my manager whether I could begin earlier and work from home on Fridays. '
         'At first, I worried that my colleagues would think I was avoiding them. '
         'However, we agreed to share an update every morning. Eventually, I finished my work more calmly. '
         'I learned that a small change can make a substantial difference when people communicate clearly.')


def check_no_overflow(page):
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Horizontal page overflow'


def main():
    messages = []
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
            args=['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        context = browser.new_context(viewport={'width':1440, 'height':1100}, permissions=['microphone'], accept_downloads=True)
        page = context.new_page()
        page.clock.install(time=datetime(2026, 10, 31, 9, 0, tzinfo=timezone.utc))
        page.on('pageerror', lambda error: messages.append({'type':'pageerror','message':str(error)}))
        page.on('console', lambda m: messages.append({'type':m.type,'message':m.text}) if m.type == 'error' else None)
        page.goto(BASE)
        expect(page.get_by_role('heading', name='Find the words. Own the conversation.')).to_be_visible()
        page.wait_for_timeout(200)
        check_no_overflow(page)
        page.screenshot(path='/tmp/mellom-desktop.png', full_page=True)
        results.append('Desktop dashboard loads without horizontal overflow')

        page.locator('[data-action="language"][data-language="no"]').click()
        expect(page.get_by_role('heading', name='Litt mer fleksibilitet')).to_be_visible()
        page.reload()
        expect(page.locator('[data-language="no"]')).to_have_attribute('aria-pressed','true')
        page.locator('[data-action="language"][data-language="en"]').click()
        results.append('Language switch changes lesson and persists on reload')

        page.locator('[data-action="go"][data-route="vocabulary"]').first.click()
        for i in range(3):
            card = page.locator('.word-card').nth(i)
            card.locator('textarea').fill(f'I want to use expression number {i + 1} precisely in everyday life.')
            card.locator('[data-action="learn-word"]').click()
        expect(page.locator('.collection-list > div')).to_have_count(3)
        expect(page.locator('[data-action="learn-word"]').first).to_contain_text('Added to your vocabulary')
        page.reload()
        expect(page.locator('.collection-list > div')).to_have_count(3)
        expect(page.locator('.word-sentence').first).to_have_value('I want to use expression number 1 precisely in everyday life.')
        results.append('Vocabulary additions persist and appear in collection')

        page.locator('[data-action="go"][data-route="argument"]').click()
        page.locator('#writing-input').fill(ARGUMENT)
        page.locator('[data-action="feedback"]').click()
        expect(page.locator('#feedback-panel')).to_contain_text('YOUR GUIDED WRITING CHECK')
        expect(page.locator('#feedback-panel')).to_contain_text('rule-based')
        page.locator('[data-action="complete-writing"]').click()
        expect(page.locator('[data-action="complete-writing"]')).to_contain_text('Practice completed')
        page.reload()
        expect(page.locator('#writing-input')).to_have_value(ARGUMENT)
        results.append('Guided feedback is labelled, writing is saved, and completion persists')

        page.get_by_role('link',name='Tell your story').click()
        expect(page.locator('#writing-input')).to_have_value('')
        page.locator('#writing-input').fill(STORY)
        page.locator('[data-action="complete-writing"]').click()
        page.get_by_role('link',name='Make your point',exact=True).click()
        expect(page.locator('#writing-input')).to_have_value(ARGUMENT)
        results.append('Argument and story drafts are independent')

        page.get_by_role('link',name='My progress').click()
        expect(page.locator('.journal-entry')).to_have_count(2)
        expect(page.locator('.stat-card').nth(0)).to_contain_text('3')
        expect(page.locator('.stat-card').nth(2)).to_contain_text('2')
        with page.expect_download() as download_info:
            page.locator('[data-action="export"]').click()
        exported = download_info.value
        exported.save_as('/tmp/mellom-export.json')
        data = json.loads(Path('/tmp/mellom-export.json').read_text())
        assert any(d['argument']['text'] == ARGUMENT for d in data['days'].values())
        results.append('Progress journal, actual statistics, and JSON export work')

        page.get_by_role('link',name='Speaking practice',exact=True).click()
        expect(page.locator('#speech-source option')).to_have_count(4)
        page.locator('#speech-source').select_option('argument')
        expect(page.locator('.speech-passage')).to_have_text(ARGUMENT)
        page.locator('[data-action="listen"]').click()
        expect(page.locator('#speech-notice')).to_contain_text('voice')
        page.locator('[data-action="record"]').click()
        expect(page.locator('#record-button')).to_contain_text('Stop recording')
        page.wait_for_timeout(1200)
        page.locator('[data-action="record"]').click()
        expect(page.locator('audio')).to_be_visible()
        assert page.locator('audio').evaluate('(audio) => audio.src.startsWith("blob:")')
        page.reload()
        expect(page.locator('audio')).to_be_visible()
        with page.expect_download() as download_info:
            page.get_by_role('link',name='Download recording').click()
        download_info.value.save_as('/tmp/mellom-test-recording.webm')
        assert Path('/tmp/mellom-test-recording.webm').stat().st_size > 0
        page.locator('[data-action="complete-speaking"]').click()
        expect(page.locator('[data-action="complete-speaking"]')).to_contain_text('completed')
        page.locator('[data-action="delete-recording"]').click()
        expect(page.locator('audio')).to_have_count(0)
        page.reload()
        expect(page.locator('audio')).to_have_count(0)
        results.append('Fake-microphone recording saves, survives reload, downloads, and deletes')

        page.locator('[data-action="settings"]:visible').click()
        expect(page.get_by_role('dialog')).to_be_visible()
        expect(page.get_by_role('dialog')).to_contain_text('No matching voice')
        page.locator('[data-action="close-settings"]').click()
        expect(page.get_by_role('dialog')).not_to_be_visible()
        results.append('Preferences opens and honestly reports missing device voice')

        page.get_by_role('link',name='Writing studio').click()
        unsafe = '<img src=x onerror="window.mellomXSS=1"> ' + ARGUMENT
        page.locator('#writing-input').fill(unsafe)
        page.get_by_role('link',name='My progress').click()
        page.locator('.journal-entry').first.locator('summary').click()
        expect(page.locator('.journal-entry').first.locator('.journal-text')).to_contain_text('<img src=x')
        assert page.evaluate('window.mellomXSS') is None
        results.append('Saved writing is escaped in journal; HTML does not execute')

        page.get_by_role('link',name='My vocabulary').click()
        page.evaluate('''() => { const key='mellom.practice.v1'; const s=JSON.parse(localStorage.getItem(key)); Object.values(s.reviews).forEach(r => r.due='2020-01-01'); localStorage.setItem(key,JSON.stringify(s)); }''')
        page.reload()
        page.locator('[data-mode="review"]').click()
        expect(page.locator('.review-card')).to_have_count(3)
        page.locator('.review-card').first.locator('summary').click()
        page.locator('.review-card').first.locator('[data-rating="good"]').click()
        expect(page.locator('.review-card')).to_have_count(2)
        results.append('Due vocabulary reviews reveal answers and reschedule on recall rating')

        mobile = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, device_scale_factor=1)
        mobile_page = mobile.new_page()
        mobile_page.on('pageerror', lambda error: messages.append({'type':'pageerror','message':str(error)}))
        mobile_page.clock.install(time=datetime(2026, 10, 31, 9, 0, tzinfo=timezone.utc))
        mobile_page.goto(BASE)
        expect(mobile_page.get_by_role('heading', name='Find the words. Own the conversation.')).to_be_visible()
        check_no_overflow(mobile_page)
        mobile_page.screenshot(path='/tmp/mellom-mobile.png', full_page=True)
        mobile_page.get_by_role('link',name='Writing studio').click()
        check_no_overflow(mobile_page)
        expect(mobile_page.locator('#writing-input')).to_be_visible()
        mobile_page.get_by_role('link',name='Speaking practice',exact=True).click()
        check_no_overflow(mobile_page)
        results.append('Mobile dashboard, writing, and speaking have no horizontal overflow')
        mobile_page.locator('[data-action="settings"]:visible').click()
        expect(mobile_page.get_by_role('dialog')).to_be_visible()
        mobile_page.locator('[data-action="close-settings"]').click()
        results.append('Mobile preferences is reachable')
        mobile.close()

        # A delayed availability response must update consent wording without losing typing.
        ai_context = browser.new_context()
        ai_page = ai_context.new_page()
        ai_page.on('pageerror', lambda error: messages.append({'type':'pageerror','message':str(error)}))
        pending_status = []
        ai_page.route('**/api/status', lambda request: pending_status.append(request))
        ai_page.route('**/api/feedback', lambda request: request.fulfill(status=502,content_type='application/json',body='{"error":"The feedback provider is temporarily unavailable."}'))
        ai_page.goto(BASE + '/#argument')
        ai_page.locator('#writing-input').fill(ARGUMENT)
        ai_page.locator('#writing-input').evaluate('(input) => input.setSelectionRange(7, 7)')
        assert pending_status, 'Status request was issued'
        pending_status[0].fulfill(status=200,content_type='application/json',body='{"aiAvailable":true,"provider":"openai"}')
        expect(ai_page.locator('[data-action="feedback"]')).to_contain_text('Get AI feedback')
        expect(ai_page.locator('#feedback-disclosure')).to_contain_text('Your draft is sent only when you request feedback')
        expect(ai_page.locator('#writing-input')).to_have_value(ARGUMENT)
        assert ai_page.locator('#writing-input').evaluate('(input) => input.selectionStart') == 7
        ai_page.locator('[data-action="feedback"]').click()
        expect(ai_page.locator('#feedback-panel')).to_contain_text('provider is temporarily unavailable')
        expect(ai_page.locator('#writing-input')).to_have_value(ARGUMENT)
        ai_page.locator('[data-action="guided-feedback"]').click()
        expect(ai_page.locator('#feedback-panel')).to_contain_text('YOUR GUIDED WRITING CHECK')
        results.append('Delayed AI availability updates disclosure without losing the draft or caret; failed AI can fall back to guided checks')
        ai_context.close()

        # Releasing an old microphone permission request must not leak a live track.
        race_context = browser.new_context(permissions=['microphone'])
        race_page = race_context.new_page()
        race_page.on('pageerror', lambda error: messages.append({'type':'pageerror','message':str(error)}))
        race_page.goto(BASE + '/#speaking')
        race_page.evaluate("""() => {
          window.nativeMic = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
          navigator.mediaDevices.getUserMedia = async (...args) => {
            const stream = await window.nativeMic(...args);
            window.pendingTracks = stream.getTracks();
            return new Promise(resolve => { window.releaseMic = () => resolve(stream); });
          };
        }""")
        race_page.locator('[data-action="record"]').click()
        race_page.wait_for_function('() => typeof window.releaseMic === "function"')
        race_page.get_by_role('link',name='Today’s practice').click()
        race_page.get_by_role('link',name='Speaking practice',exact=True).click()
        race_page.evaluate('() => { window.releaseMic(); }')
        race_page.wait_for_function('() => window.pendingTracks.every(track => track.readyState === "ended")')
        expect(race_page.locator('#record-button')).to_be_enabled()
        expect(race_page.locator('#record-button')).to_contain_text('Start recording')
        race_page.evaluate('() => { navigator.mediaDevices.getUserMedia = window.nativeMic; }')
        race_page.get_by_role('link',name='Writing studio').click()
        race_page.locator('#writing-input').fill(ARGUMENT)
        race_page.get_by_role('link',name='Speaking practice',exact=True).click()
        race_page.locator('[data-action="record"]').click()
        expect(race_page.locator('#record-button')).to_contain_text('Stop recording')
        race_page.locator('#speech-source').select_option('argument')
        expect(race_page.locator('#record-button')).to_contain_text('Stop recording')
        race_page.wait_for_timeout(1100)
        race_page.locator('[data-action="record"]').click()
        expect(race_page.locator('audio')).to_be_visible()
        results.append('Pending microphone permission is cancelled safely on navigation; changing passage during recording preserves controls')
        race_context.close()
        context.close()
        browser.close()
    report={'passed':results,'browser_messages':messages}
    Path('/tmp/mellom-browser-report.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report,indent=2))
    assert not [m for m in messages if m['type']=='pageerror'], 'Browser JavaScript runtime errors'

if __name__ == '__main__':
    main()
