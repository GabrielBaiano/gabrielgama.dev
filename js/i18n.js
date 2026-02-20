document.addEventListener('DOMContentLoaded', () => {
    const langPt = document.getElementById('btn-pt');
    const langEn = document.getElementById('btn-en');

    let currentLang = localStorage.getItem('language') || 'pt';

    const updateLanguage = (lang) => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                if (el.tagName === 'INPUT' && el.type === 'checkbox') {
                    // Skip for now, handled by labels
                } else if (el.classList.contains('toggle-label')) {
                    // Style handles this via CSS content? No, let's update if needed
                } else {
                    el.innerText = translations[lang][key];
                }
            }
        });

        // Update active state in nav
        if (langPt && langEn) {
            if (lang === 'pt') {
                langPt.classList.add('active');
                langEn.classList.remove('active');
            } else {
                langEn.classList.add('active');
                langPt.classList.remove('active');
            }
        }

        // Specific handling for blog disclaimer
        const blogDisclaimer = document.getElementById('blog-en-disclaimer');
        if (blogDisclaimer) {
            blogDisclaimer.style.display = lang === 'en' ? 'block' : 'none';
        }

        localStorage.setItem('language', lang);
        document.documentElement.lang = lang === 'pt' ? 'pt-br' : 'en';
    };

    if (langPt) langPt.addEventListener('click', () => updateLanguage('pt'));
    if (langEn) langEn.addEventListener('click', () => updateLanguage('en'));

    // Special case for dynamic posts
    const originalFetch = window.fetch;
    window.fetch = function () {
        return originalFetch.apply(this, arguments).then(response => {
            if (arguments[0].includes('posts.json')) {
                // After posts are loaded, we might need to re-translate or handle dates
                // But titles are in PT anyway as per user request
            }
            return response;
        });
    };

    updateLanguage(currentLang);
});
