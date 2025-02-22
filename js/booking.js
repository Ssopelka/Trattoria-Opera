// Telegram Bot Token и ID администратора (замените на реальные значения)
const TELEGRAM_BOT_TOKEN = '7914120726:AAEM09QpxzftMj7ndG4ZaZcLY_jb1O97sTk'; // Получите у @BotFather
const TELEGRAM_ADMIN_CHAT_ID = '915617875'; // ID администратора

// Функция для отправки сообщения в Telegram
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        console.log('Отправка в Telegram:', { url, chat_id: TELEGRAM_ADMIN_CHAT_ID, text: message });
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        const data = await response.json();
        if (!data.ok) {
            throw new Error(`Ошибка Telegram API: ${data.description} (код: ${data.error_code})`);
        }
        console.log('Сообщение успешно отправлено:', data);
    } catch (error) {
        console.error('Ошибка в sendToTelegram:', error);
        throw new Error('Ошибка отправки в Telegram: ' + error.message);
    }
}

// Функция для получения текущих бронирований
function getBookings() {
    return JSON.parse(localStorage.getItem('bookings') || '[]');
}

// Функция для сохранения бронирований
function saveBooking(booking) {
    const bookings = getBookings();
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// Проверка пересечения времени (в пределах 2 часов)
function isTimeSlotTaken(date, time) {
    const bookings = getBookings();
    const requestedDateTime = new Date(`${date}T${time}`);
    const timeWindow = 2 * 60 * 60 * 1000; // 2 часа в миллисекундах

    return bookings.some(booking => {
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        return (
            booking.date === date &&
            Math.abs(requestedDateTime - bookingDateTime) < timeWindow
        );
    });
}

// Валидация даты
function validateDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(date);
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 2);

    return inputDate >= today && inputDate <= maxDate;
}

// Обработка отправки формы
document.getElementById('submitBooking').addEventListener('click', async (e) => {
    e.preventDefault();

    const form = document.getElementById('bookingForm');
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const guests = document.getElementById('guests').value;

    // Очистка предыдущих ошибок
    document.querySelectorAll('.error-message').forEach(el => (el.textContent = ''));

    let isValid = true;

    if (!name) {
        document.getElementById('nameError').textContent = 'Пожалуйста, укажите имя';
        isValid = false;
    }
    if (!phone || !/^\+?\d{10,15}$/.test(phone)) {
        document.getElementById('phoneError').textContent = 'Укажите корректный номер телефона';
        isValid = false;
    }
    if (!date) {
        document.getElementById('dateError').textContent = 'Пожалуйста, выберите дату';
        isValid = false;
    } else if (!validateDate(date)) {
        document.getElementById('dateError').textContent = 'Дата должна быть не раньше сегодня и не позже 2 месяцев';
        isValid = false;
    }
    if (!time) {
        document.getElementById('timeError').textContent = 'Пожалуйста, выберите время';
        isValid = false;
    }
    if (!guests || guests < 1) {
        document.getElementById('guestsError').textContent = 'Укажите количество гостей (минимум 1)';
        isValid = false;
    }

    if (!isValid) return;

    if (isTimeSlotTaken(date, time)) {
        document.getElementById('timeError').textContent = 'Это время уже забронировано';
        return;
    }

    const booking = { name, phone, date, time, guests, timestamp: new Date().toISOString() };
    const message = `
<b>Бронь на ${date}</b>
Имя: ${name}
Телефон: ${phone}
Дата: ${date}
Время: ${time}
Гостей: ${guests}
    `;

    try {
        saveBooking(booking);
        await sendToTelegram(message);
        alert('Бронь успешно создана! Мы свяжемся с вами для подтверждения.');
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        form.reset();
    } catch (error) {
        alert(error.message); // Показываем пользователю причину ошибки
    }
});

// Установка ограничений даты
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 2);

    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];
});