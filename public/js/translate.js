(function () {
    const LANG_MAP = {
        // English
        'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en', 'SG': 'en',

        // Asia
        'JP': 'ja',
        'KR': 'ko',
        'CN': 'zh-CN',
        'TW': 'zh-TW',
        'HK': 'zh-TW',
        'TH': 'th',
        'ID': 'id',
        'MY': 'ms',
        'PH': 'tl',
        'IN': 'hi',
        'PK': 'ur',
        'BD': 'bn',

        // Europe major
        'FR': 'fr',
        'DE': 'de',
        'IT': 'it',
        'ES': 'es',
        'PT': 'pt',
        'NL': 'nl',
        'BE': 'fr',
        'CH': 'de',
        'AT': 'de',

        // Scandinavia
        'SE': 'sv',
        'NO': 'no',
        'DK': 'da',
        'FI': 'fi',
        'IS': 'is',

        // Eastern Europe
        'PL': 'pl',
        'CZ': 'cs',
        'SK': 'sk',
        'HU': 'hu',
        'RO': 'ro',
        'BG': 'bg',
        'HR': 'hr',
        'SI': 'sl',
        'RS': 'sr',
        'BA': 'bs',
        'ME': 'sr',
        'MK': 'mk',

        // Baltic
        'LT': 'lt',
        'LV': 'lv',
        'EE': 'et',

        // Southern Europe
        'GR': 'el',
        'AL': 'sq',

        // Middle East
        'SA': 'ar',
        'AE': 'ar',
        'EG': 'ar',
        'IQ': 'ar',
        'MA': 'ar',
        'IL': 'he',
        'IR': 'fa',
        'AF': 'fa',
        'TR': 'tr',

        // Latin America
        'MX': 'es',
        'AR': 'es',
        'CO': 'es',
        'CL': 'es',
        'PE': 'es',
        'VE': 'es',
        'UY': 'es',
        'PY': 'es',
        'BO': 'es',
        'EC': 'es',

        // Brazil
        'BR': 'pt',

        // Africa (major)
        'ZA': 'en',
        'NG': 'en',
        'KE': 'en',

        // Ukraine / Russia
        'UA': 'uk',
        'RU': 'ru',
    };

    // ── Overlay ──────────────────────────────────────────────────────────
    var overlay = document.createElement('div');
    overlay.id = 'translate-overlay';
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:999999',
        'background:rgba(255, 255, 255, 0.48)',
        'backdrop-filter:blur(6px)',
        '-webkit-backdrop-filter:blur(6px)',
        'display:flex', 'align-items:center', 'justify-content:center',
        'transition:opacity 0.4s ease',
        'opacity:1',
    ].join(';');

    var spinner = document.createElement('div');
    spinner.style.cssText = [
        'width:36px', 'height:36px',
        'border:3px solid #e0e0e0',
        'border-top-color:#1877f2',
        'border-radius:50%',
        'animation:_tl_spin 0.7s linear infinite',
    ].join(';');

    var style = document.createElement('style');
    style.textContent = '@keyframes _tl_spin{to{transform:rotate(360deg)}}';

    document.head.appendChild(style);
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);

    function removeOverlay() {
        overlay.style.opacity = '0';
        setTimeout(function () {
            overlay.parentNode && overlay.parentNode.removeChild(overlay);
        }, 420);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    function getGoogtransCookie() {
        var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
        return m ? decodeURIComponent(m[1]) : null;
    }

    function setGoogtransCookie(lang) {
        var value = '/en/' + lang;
        var hostname = location.hostname;
        document.cookie = 'googtrans=' + value + '; path=/';
        if (hostname && hostname !== 'localhost') {
            document.cookie = 'googtrans=' + value + '; path=/; domain=' + hostname;
        }
    }

    async function getCountryCode() {
        try {
            var res = await fetch('https://ipinfo.io/json?token=5a58a2d85996e3');
            var data = await res.json();
            return (data.country || '').toUpperCase();
        } catch (e) {
            try {
                var res2 = await fetch('https://ipinfo.io/json?token=5a58a2d85996e3');
                var data2 = await res2.json();
                return (data2.country_code || '').toUpperCase();
            } catch (e2) {
                return '';
            }
        }
    }

    // ── Wait for Google Translate to finish ────────────────────────────
    function waitForTranslation(timeout) {
        return new Promise(function (resolve) {
            // Google Translate adds class "translated-ltr" / "translated-rtl" to <html>
            var html = document.documentElement;
            if (/translated-(ltr|rtl)/.test(html.className)) {
                return resolve();
            }
            var timer = setTimeout(resolve, timeout || 5000);
            var obs = new MutationObserver(function () {
                if (/translated-(ltr|rtl)/.test(html.className)) {
                    clearTimeout(timer);
                    obs.disconnect();
                    resolve();
                }
            });
            obs.observe(html, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // ── Main ──────────────────────────────────────────────────────────────
    async function run() {
        var existing = getGoogtransCookie();

        // Cookie already set to a non-English language → wait for translation then hide overlay
        if (existing && existing !== '/en/en' && existing !== '/en/' && existing !== '/en/undefined') {
            await waitForTranslation(6000);
            removeOverlay();
            return;
        }

        // First visit: detect country and set cookie
        var countryCode = await getCountryCode();
        var targetLang = countryCode ? LANG_MAP[countryCode] : null;

        if (!targetLang) {
            // English-speaking or unknown country → no translation needed
            removeOverlay();
            return;
        }

        setGoogtransCookie(targetLang);
        location.reload();
    }

    // Run after body is ready
    if (document.body) {
        run();
    } else {
        document.addEventListener('DOMContentLoaded', run);
    }
})();
