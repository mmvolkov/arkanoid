from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler

TOKEN = "8755314746:AAEMWOl4GPlprc9PYfH4Z4E-Xapp0qVQd4c"
WEB_APP_URL = "https://arkanoid-worker.ewesttt.workers.dev"

async def start(update, context):
    keyboard = [[InlineKeyboardButton("🎮 Играть в Arkanoid", web_app={"url": WEB_APP_URL})]]
    await update.message.reply_text(
        "Добро пожаловать в Neon Arkanoid!\n\nИспользуй мышку или стрелки для управления.",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def help_command(update, context):
    await update.message.reply_text(
        "🕹 Neon Arkanoid\n\n"
        "Управление:\n"
        "• Мышь — двигай ракетку\n"
        "• Стрелки / A,D — двигай ракетку\n"
        "• Пробел / Клик — запустить шарик\n\n"
        "Разбей все кирпичи!"
    )

app = Application.builder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.add_handler(CommandHandler("help", help_command))
app.run_polling()
