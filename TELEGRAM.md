# Telegram Bot & Web App Integration

## Вариант 1 — Bot API (Python/Node.js)

### Создание бота
1. Напиши `@BotFather` в Telegram
2. Отправь `/newbot`, следуй инструкциям
3. Получи **токен**: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`

### Python (python-telegram-bot)
```bash
pip install python-telegram-bot
```

```python
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler

TOKEN = "YOUR_BOT_TOKEN"

async def start(update, context):
    keyboard = [[InlineKeyboardButton("🎮 Играть в Arkanoid", web_app={"url": "https://your-app-url.com"})]]
    await update.message.reply_text("Добро пожаловать в Neon Arkanoid!", reply_markup=InlineKeyboardMarkup(keyboard))

app = Application.builder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.run_polling()
```

### Node.js (node-telegram-bot-api)
```bash
npm install node-telegram-bot-api
```

```javascript
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('YOUR_BOT_TOKEN', { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать в Neon Arkanoid!', {
    reply_markup: JSON.stringify({
      inline_keyboard: [[{ text: '🎮 Играть в Arkanoid', web_app: { url: 'https://your-app-url.com' } }]]
    })
  });
});
```

---

## Вариант 2 — Telegram Web App (Mini App)

### Что это
- HTML/JS приложение в iframe внутри Telegram
- Кнопка запускает web app
- Работает на любом устройстве через Telegram客户端

### Шаги
1. **Закхостить** `arkanoid.html` на веб-сервере (GitHub Pages, Vercel, Netlify)
2. **Создать бота** через @BotFather
3. **Добавить кнопку Menu** — указать URL вашего web app
4. **Или** использовать inline кнопку с `web_app`:

```python
keyboard = [[InlineKeyboardButton("🎮 Arkanoid", web_app={"url": "https://your-domain.com/arkanoid.html"})]]
```

### Telegram Web App API (внутри arkanoid.html)
```javascript
// Проверка что запущено в Telegram
if (window.Telegram && Telegram.WebApp) {
  const tg = Telegram.WebApp;
  tg.ready();
  // Можно получить user info, показывать native UI
}
```

---

## Вариант 3 — Game Bot (без web app)

### Inline игры
- Бот принимает запросы через @BotFather `/newapp`
- Позволяет создавать inline games
- Результаты хранятся в таблице лидеров бота

---

## Деплой

### VPS (PythonAnywhere, DigitalOcean, etc.)
```bash
# Python
pip install python-telegram-bot
python bot.py
```

### Cloud Functions
- **Vercel** + Python functions
- **Cloudflare Workers**
- **AWS Lambda**

### Set Webhook (продакшен)
```python
app.set_webhook("https://your-domain.com/webhook")
```

---

## Файлы для Telegram версии

```
arkanoid-telegram/
├── bot.py              # Telegram Bot API
├── game/
│   └── index.html     # Web App версия
└── README.md
```
