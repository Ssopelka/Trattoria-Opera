const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

app.use(cors({ origin: '*' }));
app.use(express.json());

const TELEGRAM_BOT_TOKEN = '7914120726:AAEM09QpxzftMj7ndG4ZaZcLY_jb1O97sTk';
const TELEGRAM_ADMIN_CHAT_ID = '915617875';

async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        console.log('Отправка в Telegram:', { chat_id: TELEGRAM_ADMIN_CHAT_ID, text: message });
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
            throw new Error(`Telegram API ошибка: ${data.description} (код: ${data.error_code})`);
        }
        console.log('Сообщение отправлено в Telegram:', data);
        return true;
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        throw error;
    }
}

async function initializeBookingsFile() {
    try {
        const exists = await fs.access(BOOKINGS_FILE).then(() => true).catch(() => false);
        if (!exists) {
            console.log('Файл bookings.json не существует, создаём новый');
            await fs.writeFile(BOOKINGS_FILE, JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error('Ошибка инициализации bookings.json:', error);
        await fs.writeFile(BOOKINGS_FILE, JSON.stringify([], null, 2));
    }
}

async function getBookings() {
    await initializeBookingsFile();
    try {
        const data = await fs.readFile(BOOKINGS_FILE, 'utf8');
        if (!data.trim()) {
            console.log('Файл bookings.json пуст, возвращаем пустой массив');
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения bookings.json:', error);
        return [];
    }
}

async function saveBookings(bookings) {
    try {
        await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        console.log('Данные сохранены в bookings.json');
    } catch (error) {
        console.error('Ошибка записи в bookings.json:', error);
        throw error;
    }
}

async function generateUniqueBookingId(bookings) {
    const existingIds = bookings.map(booking => booking.bookingId);
    let newId;
    do {
        newId = Math.floor(1000 + Math.random() * 9000);
    } while (existingIds.includes(newId));
    return newId;
}

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await getBookings();
        console.log('Отправка броней клиенту:', bookings);
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Ошибка при получении броней:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { name, phone, date, time, guests } = req.body;
        console.log('Получен запрос:', req.body);

        if (!name || !phone || !date || !time || !guests) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        const bookings = await getBookings();
        const bookingId = await generateUniqueBookingId(bookings);
        const booking = { bookingId, name, phone, date, time, guests, createdAt: new Date().toISOString() };

        bookings.push(booking);
        await saveBookings(bookings);

        const message = `
<b>Номер брони:</b> ${bookingId}
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
<b>Имя:</b> ${name}
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
<b>Телефон:</b> ${phone}
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
<b>Дата:</b> ${date}
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
<b>Время:</b> ${time}
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
<b>Гостей:</b> ${guests}
        `;
        await sendToTelegram(message);

        res.status(201).json({ message: 'Бронь успешно создана', bookingId });
    } catch (error) {
        console.error('Ошибка на сервере:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});