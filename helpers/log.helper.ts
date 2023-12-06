import fs from "fs";
import path from "path";
import moment from "moment";

const logDir = path.join(__dirname, "../logs");

export const logEvent = (message: any) => {
	try {
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		const fileName = `${logDir}/${moment().format("DD/MM/YYYY").replaceAll("/", "-")}.log`;
		const timeLog = moment().format("hh:mm:ss A");
		const content = `======================== START LOG ==========================\nTIME: ${timeLog}\n${message}\n`;
		fs.appendFileSync(fileName, content);
	} catch (error) {
		console.log("logEvent error:::", error);
	}
};
