import TelegramBot from "node-telegram-bot-api";

const BOT_TELEGRAM = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || "");

export const sendMsgTele = async function (msg: string, group: string): Promise<void> {
	const data = await BOT_TELEGRAM.sendMessage(group, msg);
	console.log("exec: ", data);
};

export const sendMsgTeleOptions = async function (): Promise<void> {
	BOT_TELEGRAM.onText(/\/start/, (msg) => {
		const chatId = msg.chat.id;
		const opts: any = {
			reply_markup: {
				keyboard: [["Option 1", "Option 2"], ["Option 3"], ["Custom Options"]],
				one_time_keyboard: true,
			},
		};

		BOT_TELEGRAM.sendMessage(chatId, "Hello! I'm an example bot. Choose an option:", opts);
	});

	BOT_TELEGRAM.onText(/Option (\d+)/, (msg, match: any) => {
		const chatId = msg.chat.id;
		const selectedOption = match[1];

		BOT_TELEGRAM.sendMessage(chatId, `You selected Option ${selectedOption}`);
	});

	BOT_TELEGRAM.onText(/Custom Options/, (msg) => {
		const chatId = msg.chat.id;
		const opts = {
			reply_markup: {
				inline_keyboard: [
					[{ text: "Inline Option 1", callback_data: "inline_option_1" }],
					[{ text: "Inline Option 2", callback_data: "inline_option_2" }],
					[{ text: "Back to Menu", callback_data: "back_to_menu" }],
				],
			},
		};

		BOT_TELEGRAM.sendMessage(chatId, "Custom options:", opts);
	});

	BOT_TELEGRAM.on("callback_query", (query: any) => {
		const chatId = query.message.chat.id;
		const option = query.data;

		switch (option) {
			case "inline_option_1":
				BOT_TELEGRAM.sendMessage(chatId, "You selected Inline Option 1");
				break;
			case "inline_option_2":
				BOT_TELEGRAM.sendMessage(chatId, "You selected Inline Option 2");
				break;
			case "back_to_menu":
				BOT_TELEGRAM.sendMessage(chatId, "Back to the main menu");
				break;
			default:
				break;
		}
	});
};
