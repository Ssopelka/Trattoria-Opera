// Находим модальное окно и кнопку, открывающую его
const bookingModal = document.getElementById('bookingModal');
const openModalBtn = document.querySelector('[data-bs-target="#bookingModal"]');

// Сохраняем элемент, который вызвал открытие модального окна
let triggerElement = null;

// При открытии модального окна
bookingModal.addEventListener('show.bs.modal', (event) => {
    triggerElement = event.relatedTarget; // Сохраняем элемент, открывший модальное окно
    const firstInput = bookingModal.querySelector('#name'); // Первый элемент ввода
    if (firstInput) {
        firstInput.focus(); // Переводим фокус на первое поле формы
    }
});

// При закрытии модального окна
bookingModal.addEventListener('hidden.bs.modal', () => {
    if (triggerElement) {
        triggerElement.focus(); // Возвращаем фокус на элемент, открывший модальное окно
    }
});

// Валидация даты
function validateDate(dateStr) {
    const inputDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 2);
    return (
        inputDate instanceof Date &&
        !isNaN(inputDate) &&
        inputDate >= today &&
        inputDate <= maxDate
    );
}

// Валидация времени
function validateTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 13 && (hours < 22 || (hours === 22 && minutes === 0));
}

// Проверка конфликта времени
function hasTimeConflict(newBooking, existingBookings) {
    const newDateTime = new Date(`${newBooking.date}T${newBooking.time}:00`);
    console.log('Новая бронь:', newDateTime.toISOString());

    return existingBookings.some(booking => {
        if (newBooking.date !== booking.date) return false;

        const existingDateTime = new Date(`${booking.date}T${booking.time}:00`);
        const timeDiffMs = Math.abs(newDateTime - existingDateTime);
        const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
        return timeDiffHours < 1;
    });
}

// Получение существующих броней с сервера
async function fetchBookings() {
    try {
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Ошибка загрузки броней: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка при получении броней:', error);
        return [];
    }
}

// Обработка отправки формы
document.getElementById('submitBooking')?.addEventListener('click', async (e) => {
    e.preventDefault();

    const form = document.getElementById('bookingForm');
    if (!form) {
        console.error('Форма #bookingForm не найдена');
        return;
    }

    const name = document.getElementById('name')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const date = document.getElementById('date')?.value || '';
    const time = document.getElementById('time')?.value || '';
    const guests = parseInt(document.getElementById('guests')?.value) || 0;

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
    } else if (!validateTime(time)) {
        document.getElementById('timeError').textContent = 'Время должно быть с 13:00 до 22:00';
        isValid = false;
    }
    if (!guests || guests < 1 || guests > 10) {
        document.getElementById('guestsError').textContent = 'Укажите количество гостей (от 1 до 10)';
        isValid = false;
    }

    if (!isValid) {
        console.log('Валидация не пройдена');
        return;
    }

    const newBooking = { name, phone, date, time, guests };
    const existingBookings = await fetchBookings();

    if (hasTimeConflict(newBooking, existingBookings)) {
        document.getElementById('timeError').textContent = 'На это время уже забронирован столик';
        return;
    }

    try {
        console.log('Отправка данных:', newBooking);
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBooking)
        });
        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();
        alert(`Бронь успешно создана! Ваш номер брони: ${result.bookingId}`);
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        form.reset();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
});

// Установка ограничений даты и времени
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const guestsInput = document.getElementById('guests');

    if (!dateInput || !timeInput || !guestsInput) {
        console.error('Один из элементов формы не найден');
        return;
    }

    const today = new Date();
    today.setHours(today.getHours() + 2);
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 2);

    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];
    timeInput.min = '13:00';
    timeInput.max = '22:00';

    dateInput.addEventListener('change', () => {
        const selectedDate = dateInput.value;
        const todayStr = today.toISOString().split('T')[0];
        if (selectedDate === todayStr) {
            const currentTime = today.toTimeString().slice(0, 5);
            timeInput.min = currentTime > '13:00' ? (currentTime > '22:00' ? '22:00' : currentTime) : '13:00';
        } else {
            timeInput.min = '13:00';
        }
        timeInput.max = '22:00';
    });

    guestsInput.min = 1;
    guestsInput.max = 10;
});