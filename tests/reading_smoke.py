"""Browser regressions for larger text and daily classic poetry.
Run with the local server running: python tests/reading_smoke.py.
Uses installed Playwright + /usr/bin/chromium; does not download browsers or use real audio.
"""
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('MELLOM_TEST_URL', 'http://127.0.0.1:5173')
DATE = '2026-10-31'
NOW = datetime(2026, 10, 31, 9, 0, tzinfo=timezone.utc)


def no_overflow(page, label):
    metrics = page.evaluate('''() => ({width: innerWidth, scroll: document.documentElement.scrollWidth})''')
    assert metrics['scroll'] <= metrics['width'], f'{label}: horizontal overflow {metrics}'


def font_at_least(page, selector, minimum, label):
    el = page.locator(selector).first
    expect(el).to_be_visible()
    size = el.evaluate('(element) => parseFloat(getComputedStyle(element).fontSize)')
    assert size >= minimum, f'{label}: {selector} is {size}px, expected >= {minimum}px'
    return size


def set_language(page, language):
    page.locator(f'[data-action="language"][data-language="{language}"]').click()
    expect(page.locator(f'[data-action="language"][data-language="{language}"]')).to_have_attribute('aria-pressed', 'true')


def poem_for(page, date, language):
    return page.evaluate('''async ([date, language]) => {
      const module = await import('/src/poems.mjs');
      return module.getDailyPoem(date, language);
    }''', [date, language])


def assert_poem_content(page, poem):
    expect(page.locator('#poem-title')).to_have_text(poem['title'])
    expect(page.locator('.poem-byline')).to_contain_text(poem['author'])
    expect(page.locator('.poem-byline')).to_contain_text(str(poem['year']))
    expect(page.locator('.poem-credit')).to_contain_text('Public-domain text')
    expect(page.locator('.poem-credit a')).to_have_attribute('href', poem['source']['url'])
    expect(page.locator('.poem-credit a')).to_have_text(poem['source']['label'])
    expect(page.locator('.poem-context')).to_contain_text(poem['context'])
    assert page.locator('.poem-text span').all_text_contents() == [line for line in poem['lines'] if line.strip()]
    assert page.locator('.poem-glossary dt').all_text_contents() == [word['term'] for word in poem['glossary']]
    assert page.locator('.poem-glossary dd').all_text_contents() == [word['meaning'] for word in poem['glossary']]
    if poem['excerpt']:
        expect(page.locator('.poem-reading-card>.tag')).to_contain_text('Excerpt')
        expect(page.locator('.poem-credit')).to_contain_text('excerpted from the original')
    else:
        expect(page.locator('.poem-reading-card>.tag')).not_to_contain_text('Excerpt')


def main():
    results = []
    errors = []
    sizes = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
            args=['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        context = browser.new_context(viewport={'width':1440,'height':1100})
        page = context.new_page()
        page.clock.install(time=NOW)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE)
        expect(page.locator('.daily-poem-preview')).to_be_visible()
        no_overflow(page, 'Desktop today')
        sizes['dashboard_paragraph'] = font_at_least(page, '.hero-copy>p', 16, 'Dashboard descriptive text')
        sizes['activity_paragraph'] = font_at_least(page, '.activity-card p', 16, 'Activity descriptive text')
        sizes['button'] = font_at_least(page, '.hero-copy .button', 14, 'Practice control')
        sizes['language_control'] = font_at_least(page, '.language-switch button', 14, 'Language control')
        page.screenshot(path='/tmp/mellom-reading-desktop-today.png', full_page=True)
        english = poem_for(page, DATE, 'en')
        expect(page.locator('#daily-poem-heading')).to_have_text(english['title'])
        page.locator('[data-action="go"][data-route="poem"]').click()
        assert_poem_content(page, english)
        sizes['poetry'] = font_at_least(page, '.poem-text p', 20, 'Poetry reading text')
        sizes['poem_context'] = font_at_least(page, '.poem-context p', 16, 'Poem context text')
        page.screenshot(path='/tmp/mellom-reading-desktop-poem.png', full_page=True)
        page.reload()
        assert_poem_content(page, english)
        results.append('English daily poem is deterministic on reload, with exact lines, author/year, public-domain source, context, glossary, and excerpt labelling')

        page.evaluate('() => { speechSynthesis.getVoices = () => []; }')
        page.locator('[data-action="listen-poem"]').click()
        expect(page.locator('#speech-notice')).to_contain_text('No American English listening voice')
        page.locator('[data-action="practise-poem"]').click()
        expect(page.locator('#speech-source')).to_have_value('poem')
        expect(page.locator('.speech-passage')).to_have_text('\n'.join(english['lines']))
        page.locator('#speech-source').select_option('model')
        expect(page.locator('.speech-passage')).not_to_have_text('\n'.join(english['lines']))
        results.append('Poetry listening reports missing device voices honestly; read-aloud opens the exact poem in Speaking and normal passage remains available')

        page.goto(BASE + '/#poem')
        set_language(page, 'no')
        norwegian = poem_for(page, DATE, 'no')
        assert_poem_content(page, norwegian)
        page.reload()
        assert_poem_content(page, norwegian)
        results.append('Norwegian daily poem uses its own original text and credits and remains stable on reload')
        page.locator('[data-action="go"][data-route="today"]').click()
        expect(page.locator('#daily-poem-heading')).to_have_text(norwegian['title'])
        results.append('Poem page returns to today’s practice without losing language selection')

        page.clock.set_system_time(datetime(2026, 11, 1, 9, 0, tzinfo=timezone.utc))
        page.reload()
        set_language(page, 'en')
        english_next = poem_for(page, '2026-11-01', 'en')
        assert english_next['title'] != english['title'], 'English selection should rotate on the next day'
        expect(page.locator('#daily-poem-heading')).to_have_text(english_next['title'])
        page.locator('[data-action="go"][data-route="poem"]').click()
        assert_poem_content(page, english_next)
        set_language(page, 'no')
        norwegian_next = poem_for(page, '2026-11-01', 'no')
        assert norwegian_next['title'] != norwegian['title'], 'Norwegian selection should rotate on the next day'
        assert_poem_content(page, norwegian_next)
        results.append('Both languages rotate to a different poem on the next Oslo calendar day')

        # Narrow CSS viewports exercise the layout reflow needed at high browser zoom.
        # 720 CSS pixels corresponds to 200% zoom on a 1440px-wide display.
        for width in [1440, 850, 720, 600, 390, 320]:
            page.set_viewport_size({'width':width,'height':900})
            for language in ['en','no']:
                set_language(page, language)
                for route in ['today','poem','vocabulary','argument','speaking','progress']:
                    page.goto(BASE + '/#' + route)
                    expect(page.locator('#page')).not_to_be_empty()
                    no_overflow(page, f'{width}px / {language} / {route}')
                    if route == 'today':
                        font_at_least(page, '.hero-copy>p', 16, f'{width}px descriptive text')
                        font_at_least(page, '.hero-copy .button', 14, f'{width}px controls')
                        if width <= 600:
                            sizes[f'mobile_nav_{width}'] = font_at_least(page, '.nav-item>span', 10, f'{width}px navigation')
                    if route == 'poem':
                        font_at_least(page, '.poem-text p', 20, f'{width}px poetry')
                        font_at_least(page, '.poem-context p', 16, f'{width}px context')
                    if route == 'vocabulary':
                        font_at_least(page, '.word-meaning', 16, f'{width}px vocabulary meaning')
            results.append(f'{width}px: all six routes in English and Norwegian have readable text and no horizontal overflow')

        # Exercise every bilingual selection at the narrowest supported width.
        page.set_viewport_size({'width':320,'height':900})
        for offset in range(7):
            date = NOW + timedelta(days=offset)
            date_key = date.date().isoformat()
            page.clock.set_system_time(date)
            page.goto(BASE + '/#poem')
            page.reload()
            for language in ['en','no']:
                set_language(page, language)
                expected = poem_for(page, date_key, language)
                assert_poem_content(page, expected)
                no_overflow(page, f'320px / {language} / poem date {date_key}')
        results.append('All 14 bilingual daily poem selections render their exact excerpts/credits without overflow at 320px')

        page.set_viewport_size({'width':390,'height':844})
        page.clock.set_system_time(NOW)
        page.goto(BASE)
        page.reload()
        set_language(page, 'en')
        page.screenshot(path='/tmp/mellom-reading-mobile-today.png', full_page=True)
        page.locator('[data-action="go"][data-route="poem"]').click()
        page.screenshot(path='/tmp/mellom-reading-mobile-poem.png', full_page=True)
        set_language(page, 'no')
        page.screenshot(path='/tmp/mellom-reading-mobile-poem-no.png', full_page=True)
        context.close()
        browser.close()
    report = {'passed':results,'computed_font_sizes_px':sizes,'runtime_errors':errors}
    Path('/tmp/mellom-reading-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))
    assert not errors, 'Runtime errors while reading or changing languages'

if __name__ == '__main__':
    main()
