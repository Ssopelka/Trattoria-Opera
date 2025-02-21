// Утилита для debounce (ограничивает частоту вызовов функций)
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Плавная прокрутка к якорям с учетом высоты навигации
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);

        if (!target) {
            console.warn(`Элемент с ID ${targetId} не найден`);
            return;
        }

        const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

        // Проверка поддержки smooth scrolling
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else {
            // Полифилл для старых браузеров
            const start = window.pageYOffset;
            const distance = targetPosition - start;
            const duration = 800;
            let startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                window.scrollTo(0, start + distance * progress * (progress < 0.5 ? 2 * progress : 2 * (1 - progress)));
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }
    });
});

// Анимации при прокрутке
const animateOnScroll = () => {
    const sections = document.querySelectorAll('section');
    if (!sections.length) {
        console.warn('Секции не найдены для анимации');
        return;
    }

    const windowHeight = window.innerHeight;

    sections.forEach(section => {
        // Проверяем, не анимирован ли уже элемент
        if (section.classList.contains('animated')) return;

        const rect = section.getBoundingClientRect();
        if (rect.top <= windowHeight * 0.8 && rect.bottom >= 0) {
            section.classList.add('animated');
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }
    });
};

// Применяем debounce к функции скролла для оптимизации
const debouncedAnimate = debounce(animateOnScroll, 100);

// Запуск анимации при загрузке и скролле
window.addEventListener('scroll', debouncedAnimate);
window.addEventListener('load', () => {
    animateOnScroll(); // Первоначальная проверка видимости
});

// Инициализация Яндекс.Карт
function initMap() {
    if (typeof ymaps === 'undefined') {
        console.error('Яндекс.Карты API не загрузился. Проверьте API-ключ.');
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = '<p>Не удалось загрузить карту. Проверьте подключение или свяжитесь с нами: +7 (952) 206-92-00</p>';
        }
        return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Элемент #map не найден');
        return;
    }

    const myMap = new ymaps.Map(mapElement, {
        center: [59.925746, 30.291757],
        zoom: 18,
        controls: ['zoomControl']
    });

    const myPlacemark = new ymaps.Placemark(
        [59.925746, 30.291757],
        {
            hintContent: 'Trattoria Opera',
            balloonContent: 'г. Санкт-Петербург, улица Декабристов, 31'
        },
        {
            preset: 'islands#icon',
            iconColor: '#d9534f'
        }
    );

    myPlacemark.events.add('click', () => {
        window.open('https://yandex.ru/profile/203396353214?lang=ru', '_blank');
    });

    myMap.geoObjects.add(myPlacemark);
    myMap.container.fitToViewport();
}

// Запуск карты после загрузки DOM и API
document.addEventListener('DOMContentLoaded', () => {
    const script = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (typeof ymaps !== 'undefined') {
        ymaps.ready(initMap);
    } else if (script) {
        script.addEventListener('load', () => ymaps.ready(initMap));
    } else {
        console.warn('Скрипт Яндекс.Карт не найден');
    }
});

// Дополнительные стили для анимации (добавляются через JS для согласованности с CSS)
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    section {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    }
    section.animated {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(styleSheet);