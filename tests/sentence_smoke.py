"""Browser regressions for per-expression vocabulary sentence coaching.
Run after npm run dev: python tests/sentence_smoke.py.
No real AI service is contacted; optional AI is mocked with Playwright routes.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('MELLOM_TEST_URL', 'http://127.0.0.1:5173')
NOW = datetime(2026, 10, 31, 9, 0, tzinfo=timezone.utc)
TODAY = '2026-10-31-en'
YESTERDAY = '2026-10-30-en'
KEY = 'mellom.practice.v1'


def scoped(page, number=0):
    return page.locator('.word-grid>.word-card').nth(number).locator('.sentence-practice')


def overflow(page, label):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{label}: horizontal overflow'


def ai_result(text='A trade-off exists.', summary='The two priorities could be clearer.', revision='There is a trade-off between flexibility and collaboration.'):
    return {'source':'ai','summary':summary,'strengths':['The sentence introduces the target expression.'],
            'suggestions':['Name the two priorities you are balancing.'],'questions':['Which benefit matters most to you?'],
            'usedWords':['a trade-off'],'wordCount':len(text.split()),'revision':revision}


def install_page(browser, errors, width=1440):
    context = browser.new_context(viewport={'width':width,'height':1100})
    page = context.new_page()
    page.clock.install(time=NOW)
    page.on('pageerror', lambda error: errors.append(str(error)))
    return context, page


def main():
    results = []
    errors = []
    payloads = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
            args=['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'])
        context, page = install_page(browser, errors)
        # Simulate static hosting: there is no API server, but core practice must work.
        forbidden_ai = []
        page.route('**/api/status', lambda request: request.fulfill(status=404,body='No API on this static host'))
        page.route('**/api/feedback', lambda request: (forbidden_ai.append(request.request.post_data),request.fulfill(status=503,body='Unexpected AI request')))
        page.goto(BASE + '/#vocabulary')
        first, second = scoped(page), scoped(page,1)
        expect(first.locator('[data-action="sentence-guided"]')).to_be_disabled()
        first.locator('textarea').fill('Two words')
        expect(first.locator('[data-action="sentence-guided"]')).to_be_disabled()
        first.locator('textarea').fill('A trade-off exists.')
        expect(first.locator('[data-action="sentence-guided"]')).to_be_enabled()
        first.locator('textarea').evaluate('(element) => { window.sentenceNode = element; element.setSelectionRange(5,5); }')
        first.locator('[data-action="sentence-guided"]').click()
        expect(first.locator('.sentence-result')).to_have_attribute('data-source','guided')
        expect(first.locator('.sentence-result')).to_contain_text('contains “a trade-off”')
        expect(first.locator('.sentence-result')).not_to_contain_text('15 words')
        expect(first.locator('.sentence-result')).not_to_contain_text('80–120')
        expect(first.locator('textarea')).to_have_value('A trade-off exists.')
        assert first.locator('textarea').evaluate('(element) => element === window.sentenceNode')
        expect(second.locator('.sentence-result')).to_have_count(0)
        results.append('Static-host guided sentence check enables at 3 words, targets the expression, preserves the original, and does not apply essay-length requirements')

        first.locator('textarea').fill('I need some time.')
        expect(first.locator('.sentence-result')).to_have_count(0)
        first.locator('[data-action="sentence-guided"]').click()
        expect(first.locator('.sentence-result')).to_contain_text('I did not find “a trade-off”')
        second.locator('textarea').fill('I am autonomy.')
        second.locator('[data-action="sentence-guided"]').click()
        expect(second.locator('.sentence-result')).to_contain_text('I have autonomy over')
        expect(first.locator('.sentence-result')).to_contain_text('I did not find')
        expect(second.locator('textarea')).to_have_value('I am autonomy.')
        results.append('Editing clears stale feedback; each card gets independent targeted usage prompts')

        first.locator('textarea').fill('A trade-off exists.')
        first.locator('[data-action="sentence-guided"]').click()
        page.locator('.word-grid>.word-card').first.locator('[data-action="learn-word"]').click()
        page.reload()
        first = scoped(page)
        expect(first.locator('.sentence-result')).to_have_attribute('data-source','guided')
        expect(first.locator('textarea')).to_have_value('A trade-off exists.')
        expect(page.locator('.word-grid>.word-card').first.locator('[data-action="learn-word"]')).to_contain_text('Added')
        results.append('Sentence and exact-text feedback survive vocabulary learning and reload')

        page.locator('[data-language="no"]').click()
        norwegian = scoped(page)
        norwegian.locator('textarea').fill('En avveining er nødvendig.')
        norwegian.locator('[data-action="sentence-guided"]').click()
        expect(norwegian.locator('.sentence-result')).to_contain_text('contains “en avveining”')
        page.locator('[data-language="en"]').click()
        expect(scoped(page).locator('textarea')).to_have_value('A trade-off exists.')
        expect(scoped(page).locator('.sentence-result')).not_to_contain_text('en avveining')
        results.append('English and Norwegian sentence checks and saved drafts stay separate')

        # A learned expression from an older day must remain editable in the collection.
        page.evaluate('''([key, day]) => {
          const state=JSON.parse(localStorage.getItem(key));
          state.days[day]={words:['work-en-1'],sentences:{'work-en-1':'A trade-off was difficult yesterday.'},sentenceFeedback:{},speaking:false};
          localStorage.setItem(key,JSON.stringify(state));
        }''',[KEY,YESTERDAY])
        page.reload()
        history = page.locator('.saved-sentences').first
        history.locator('summary').first.click()
        old_form = history.locator('.sentence-practice')
        expect(old_form.locator('textarea')).to_have_value('A trade-off was difficult yesterday.')
        old_form.locator('textarea').fill('A trade-off between comfort and cost was unavoidable.')
        old_form.locator('[data-action="sentence-guided"]').click()
        expect(old_form.locator('.sentence-result')).to_have_attribute('data-source','guided')
        expect(scoped(page).locator('textarea')).to_have_value('A trade-off exists.')
        stored = page.evaluate('key => JSON.parse(localStorage.getItem(key))',KEY)
        assert stored['days'][TODAY]['sentences']['work-en-1'] == 'A trade-off exists.'
        assert stored['days'][YESTERDAY]['sentences']['work-en-1'] == 'A trade-off between comfort and cost was unavoidable.'
        assert stored['days'][YESTERDAY]['sentenceFeedback']['work-en-1']['text'] == stored['days'][YESTERDAY]['sentences']['work-en-1']
        page.reload()
        page.locator('.saved-sentences').first.locator('summary').first.click()
        expect(page.locator('.saved-sentences').first.locator('.sentence-result')).to_have_attribute('data-source','guided')
        results.append('Older saved sentences are editable/checkable and persist without overwriting today’s draft')

        page.evaluate("""([key, day]) => {
          const state=JSON.parse(localStorage.getItem(key));
          state.days[day].sentences['work-en-3']='A schedule can accommodate different needs.';
          delete state.reviews['work-en-3'];
          localStorage.setItem(key,JSON.stringify(state));
        }""",[KEY,YESTERDAY])
        page.reload()
        unlearned = page.locator('.collection-list>div').filter(has_text='to accommodate')
        expect(unlearned).to_contain_text('Not added to review yet')
        unlearned.locator('.saved-sentences>summary').click()
        unlearned.locator('[data-action="sentence-guided"]').click()
        expect(unlearned.locator('.sentence-result')).to_have_attribute('data-source','guided')
        expect(unlearned.locator('textarea')).to_have_value('A schedule can accommodate different needs.')
        page.locator('.collection-list>div').first.locator('.saved-sentences>summary').click()
        results.append('An older sentence remains accessible and checkable even if its expression was never added to vocabulary review')

        for width in [390,320]:
            page.set_viewport_size({'width':width,'height':844})
            overflow(page,f'{width}px sentence feedback and saved history')
            expect(scoped(page).locator('.sentence-result')).to_be_visible()
            page.screenshot(path=f'/tmp/mellom-sentence-mobile-{width}.png',full_page=True)
        page.set_viewport_size({'width':1440,'height':1100})
        page.screenshot(path='/tmp/mellom-sentence-desktop.png',full_page=True)
        assert not forbidden_ai, 'Guided checks must not call the AI endpoint'
        results.append('Guided practice makes no AI requests; 390px/320px sentence results and historical editor do not overflow')

        unsafe = '<img src=x onerror="window.sentenceXSS=1"> A trade-off exists.'
        scoped(page).locator('textarea').fill(unsafe)
        scoped(page).locator('[data-action="sentence-guided"]').click()
        page.reload()
        expect(scoped(page).locator('textarea')).to_have_value(unsafe)
        assert page.evaluate('window.sentenceXSS') is None
        results.append('Saved sentence markup is escaped on reload')
        context.close()

        # Resolve AI availability after typing: only optional UI should update.
        ai_context, ai_page = install_page(browser, errors)
        pending_status = []
        pending_feedback = []
        mode = {'value':'success'}
        ai_page.route('**/api/status',lambda request: pending_status.append(request))
        def handle_feedback(request):
            payload = request.request.post_data_json
            payloads.append(payload)
            if mode['value'] == 'delay':
                pending_feedback.append(request)
            elif mode['value'] == 'error':
                request.fulfill(status=502,content_type='application/json',body=json.dumps({'error':'The feedback provider is temporarily unavailable.'}))
            else:
                request.fulfill(status=200,content_type='application/json',body=json.dumps(ai_result(revision='<img src=x onerror="window.aiSentenceXSS=1"> A clearer trade-off.')))
        ai_page.route('**/api/feedback',handle_feedback)
        ai_page.goto(BASE + '/#vocabulary')
        target = scoped(ai_page)
        target.locator('textarea').fill('A trade-off exists.')
        target.locator('textarea').evaluate('(element) => { window.originalSentenceNode=element; element.setSelectionRange(7,7); }')
        pending_status[0].fulfill(status=200,content_type='application/json',body='{"aiAvailable":true,"provider":"openai"}')
        expect(target.locator('[data-action="sentence-ai"]')).to_be_visible()
        expect(target.locator('.sentence-ai-disclosure')).to_contain_text('openai receives this sentence and expression only when you request AI feedback')
        assert target.locator('textarea').evaluate('(element) => element === window.originalSentenceNode && element.selectionStart === 7')
        expect(target.locator('[data-action="sentence-guided"]')).to_contain_text('Check my sentence')
        assert not payloads
        results.append('Delayed AI availability preserves the vocabulary textarea/caret and reveals a separate explicitly disclosed AI button')

        target.locator('[data-action="sentence-ai"]').click()
        expect(target.locator('.sentence-result')).to_have_attribute('data-source','ai')
        expect(target.locator('textarea')).to_have_value('A trade-off exists.')
        target.locator('.sentence-model').first.locator('summary').click()
        expect(target.locator('.sentence-model').first.locator('blockquote')).to_have_text('<img src=x onerror="window.aiSentenceXSS=1"> A clearer trade-off.')
        assert ai_page.evaluate('window.aiSentenceXSS') is None
        payload = payloads[-1]
        assert payload['kind'] == 'sentence' and payload['language'] == 'en'
        assert payload['text'] == 'A trade-off exists.'
        assert payload['words'] == ['a trade-off'] and payload['vocabulary']['term'] == 'a trade-off'
        assert all(payload['vocabulary'].get(key) for key in ['meaning','collocation','example','tip'])
        expect(scoped(ai_page,1).locator('.sentence-result')).to_have_count(0)
        results.append('AI request sends exactly one sentence and its target metadata; revision stays optional, escaped, and separate from the original')

        mode['value']='delay'
        target.locator('textarea').fill('A trade-off balances two priorities.')
        target.locator('[data-action="sentence-ai"]').click()
        assert pending_feedback
        target.locator('textarea').fill('A trade-off can change over time.')
        expect(target.locator('.sentence-result')).to_have_count(0)
        try:
            pending_feedback.pop().fulfill(status=200,content_type='application/json',body=json.dumps(ai_result(summary='STALE RESPONSE MUST NOT APPEAR')))
        except Exception:
            pass  # Aborting the edited request may already close the routed request.
        ai_page.wait_for_timeout(150)
        expect(target.locator('.sentence-result')).to_have_count(0)
        expect(target.locator('textarea')).to_have_value('A trade-off can change over time.')
        expect(target.locator('[data-action="sentence-ai"]')).to_be_enabled()
        results.append('Editing during delayed AI cancels/discards stale feedback and keeps the changed sentence')

        target.locator('[data-action="sentence-ai"]').click()
        ai_page.locator('[data-language="no"]').click()
        try:
            pending_feedback.pop().fulfill(status=200,content_type='application/json',body=json.dumps(ai_result(summary='ENGLISH-ONLY RESPONSE')))
        except Exception:
            pass
        ai_page.wait_for_timeout(150)
        expect(scoped(ai_page).locator('.sentence-result')).to_have_count(0)
        expect(scoped(ai_page).locator('textarea')).to_have_value('')
        ai_page.locator('[data-language="en"]').click()
        expect(scoped(ai_page).locator('.sentence-result')).to_contain_text('ENGLISH-ONLY RESPONSE')
        results.append('Pending English feedback never appears on a Norwegian card and is attached to the originating context')

        # Advance to the next date while the old expression request is pending.
        target = scoped(ai_page)
        target.locator('textarea').fill('A trade-off needs a clear explanation.')
        target.locator('[data-action="sentence-ai"]').click()
        ai_page.clock.set_system_time(datetime(2026,11,1,9,0,tzinfo=timezone.utc))
        ai_page.evaluate('() => dispatchEvent(new Event("focus"))')
        ai_page.locator('[data-language="en"]').click()
        try:
            pending_feedback.pop().fulfill(status=200,content_type='application/json',body=json.dumps(ai_result(summary='YESTERDAY ONLY RESPONSE')))
        except Exception:
            pass
        ai_page.wait_for_timeout(150)
        expect(scoped(ai_page).locator('.sentence-result')).to_have_count(0)
        expect(scoped(ai_page).locator('textarea')).to_have_value('')
        results.append('A delayed previous-day response cannot populate the new day’s vocabulary editor')

        mode['value']='error'
        current = scoped(ai_page)
        current_term = ai_page.locator('.word-grid>.word-card').first.locator('h2').inner_text()
        current.locator('textarea').fill(f'{current_term} can change the situation.')
        current.locator('[data-action="sentence-ai"]').click()
        expect(current.locator('.notice.error')).to_contain_text('provider is temporarily unavailable')
        current.locator('[data-action="sentence-guided"]').click()
        expect(current.locator('.sentence-result')).to_have_attribute('data-source','guided')
        expect(current.locator('.notice.error')).to_have_count(0)
        results.append('Provider errors preserve the sentence and allow an immediate guided check fallback')
        ai_context.close()

        # Static builds explicitly disable API discovery, not merely AI requests.
        static_context, static_page = install_page(browser, errors)
        static_requests = []
        static_page.on('request', lambda request: static_requests.append(request.url) if '/api/' in request.url else None)
        def static_index(request):
            response = request.fetch()
            markup = response.text().replace('<head>', '<head><meta name="mellom-hosting" content="static">', 1)
            request.fulfill(response=response, body=markup)
        static_page.route(BASE + '/',static_index)
        static_page.goto(BASE + '/#vocabulary')
        static_form = scoped(static_page)
        static_form.locator('textarea').fill('A trade-off exists.')
        static_form.locator('[data-action="sentence-guided"]').click()
        expect(static_form.locator('.sentence-result')).to_have_attribute('data-source','guided')
        assert static_requests == [], f'Static build contacted API: {static_requests}'
        results.append('Explicit static-host mode runs sentence coaching without any API discovery or feedback requests')
        static_context.close()

        # Browser storage changes must never silently replace an active sentence.
        tabs_context, tab_a = install_page(browser, errors)
        tab_a.goto(BASE + '/#vocabulary')
        a = scoped(tab_a)
        a.locator('textarea').fill('A trade-off matters to me.')
        a.locator('textarea').evaluate('(element) => { window.tabSentenceNode=element; }')
        tab_b = tabs_context.new_page()
        tab_b.clock.install(time=NOW)
        tab_b.on('pageerror',lambda error:errors.append(str(error)))
        tab_b.goto(BASE + '/#vocabulary')
        b = scoped(tab_b)
        expect(b.locator('textarea')).to_have_value('A trade-off matters to me.')
        b.locator('textarea').fill('A trade-off means balancing two priorities.')
        expect(a.locator('.sentence-conflict')).to_be_visible()
        expect(a.locator('textarea')).to_have_value('A trade-off matters to me.')
        expect(a.locator('[data-action="sentence-guided"]')).to_be_disabled()
        assert a.locator('textarea').evaluate('(element) => element === window.tabSentenceNode')
        a.locator('[data-action="sentence-use-saved"]').click()
        expect(a.locator('textarea')).to_have_value('A trade-off means balancing two priorities.')
        expect(a.locator('.sentence-conflict')).to_have_count(0)
        expect(a.locator('[data-action="sentence-guided"]')).to_be_enabled()
        b.locator('textarea').fill('A trade-off can affect my priorities.')
        expect(a.locator('.sentence-conflict')).to_be_visible()
        a.locator('[data-action="sentence-keep-local"]').click()
        expect(a.locator('textarea')).to_have_value('A trade-off means balancing two priorities.')
        expect(a.locator('.sentence-conflict')).to_have_count(0)
        a.locator('[data-action="sentence-guided"]').click()
        expect(a.locator('.sentence-result')).to_have_attribute('data-source','guided')
        stored = tab_a.evaluate('key => JSON.parse(localStorage.getItem(key))',KEY)
        assert stored['days'][TODAY]['sentences']['work-en-1'] == 'A trade-off means balancing two priorities.'
        results.append('Cross-tab changes preserve the visible editor and disable checks until Load saved or Keep shown is explicitly chosen')
        tabs_context.close()
        browser.close()
    report={'passed':results,'runtime_errors':errors,'mock_ai_requests':len(payloads)}
    Path('/tmp/mellom-sentence-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))
    assert not errors, 'Browser runtime errors in sentence coaching'

if __name__ == '__main__':
    main()
