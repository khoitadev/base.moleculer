const util = require("util");
const execOrigin = util.promisify(require("child_process").exec);
const md5 = require("md5");
const crypto = require("crypto");
// import sha256, { Hash, HMAC } from "fast-sha256";
// const requestIp = require("request-ip");
// const satelize = require("satelize");
// const randomString = require("randomstring");

const TIME_REQUIREMENT = process.env.TIME_REQUIREMENT ?? 30;
const KEY_VERSION_SIGN = process.env.KEY_VERSION_SIGN;
const KEY_SECRET_SIGN = process.env.KEY_SECRET_SIGN;

const helper = {
	exec: async function (cmd: string) {
		console.log("exec: ", cmd);
		return execOrigin(cmd);
	},
	formatTimeWithHours: (totalSeconds: number): string => {
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = Math.floor(totalSeconds % 60);

		const formattedHours = String(hours).padStart(2, "0");
		const formattedMinutes = String(minutes).padStart(2, "0");
		const formattedSeconds = String(seconds).padStart(2, "0");

		return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
	},

	// getTimeByTimezone: function (ip: string) {
	// 	return satelize.satelize({ ip }, (err: any, payload: any) => {
	// 		return payload;
	// 	});
	// },
	// getIpByRequest: function (req: any) {
	// 	return requestIp.getClientIp(req);
	// },
	// secretSHA256: function (str: string) {
	// 	return sha256(process.env.SECRET + str);
	// },
	getCurrentTimestamp: function () {
		return Math.round(new Date().getTime() / 1000);
	},
	stringToTime: function (str: string) {
		return Math.round(Date.parse(str) / 1000);
	},
	// getUniqueString: function (data: string) {
	// 	return md5(data + Math.round(new Date().getTime() / 1000)) + randomString.generate();
	// },
	// randomCode: function ({ length, type }: any) {
	// 	const options: any = {};
	// 	if (length) options.length = length;
	// 	if (type) options.type = type;
	// 	return randomString.generate(options);
	// },
	generateFileName: function (originalname: any) {
		// let splitName = originalname.split(".");
		// let extension = splitName[splitName.length - 1];
		const c = originalname.lastIndexOf(".");
		let extension = originalname.slice(c + 1);
		let name = originalname.slice(0, c);
		name = name.replace(/\n|[^\w\s]/gi, "");
		extension = extension.toLowerCase();
		// let hashFile = sha256(originalname);
		// let unique = Math.random().toString(36).substring(7) + "_" + Date.now();
		const unique = name.replaceAll(" ", "_").slice(0, 20) + "_" + Date.now();
		// return `${hashFile}_${unique}.${extension}`;
		return `${unique}.${extension}`;
	},
	generateCode: function (): string {
		const stringOtp = "0123456789";
		let otp = "";
		for (let i = 0; i < 8; i++) {
			otp += stringOtp.charAt(Math.floor(Math.random() * 10));
		}
		return otp;
	},
	getFolderNameByMonth: function () {
		const d = new Date();
		return `${d.getMonth() + 1}-${d.getFullYear()}`;
	},
	sortObject: (o: any) =>
		Object.keys(o)
			.sort()
			.reduce((r: any, k) => ((r[k] = o[k]), r), {}),
	objToString: (obj: any): string => {
		let dataMd5 = "";
		for (const key in obj) {
			dataMd5 += key + obj[key];
		}
		return dataMd5;
	},
	generateParamsSignUrl: function (params: any) {
		const keySecret = KEY_SECRET_SIGN;
		const month = new Date().getMonth();
		const v = `${KEY_VERSION_SIGN}${month % 4}`;
		params.nonce = crypto.randomBytes(16).toString("base64");
		params.time = Date.now();
		const dataMd5 = helper.objToString(helper.sortObject({ ...params, keySecret, v }));
		params.sign = md5(dataMd5);
		return params;
	},
	validateSign: function (params: any): boolean {
		const { sign, ...data } = params;
		const month = new Date().getMonth();
		const keySecret = KEY_SECRET_SIGN;
		const v = `${KEY_VERSION_SIGN}${month % 4}`;
		const dataMd5: string = helper.objToString(helper.sortObject({ ...data, keySecret, v }));
		const signBe = md5(dataMd5);
		return signBe === sign;
	},
	validateSignRequest: function (data: any, MoleculerClientError: any) {
		const { time, sign } = data;
		const timeRequest = (Date.now() - time) / 1000;
		if (timeRequest > +TIME_REQUIREMENT)
			throw new MoleculerClientError("server-is-busy!", 503, "server-is-busy!");
		if (!sign || !helper.validateSign(data))
			throw new MoleculerClientError("bad-request!", 400, "bad-request!");
	},
	// axios: async function (method: string, url: string, headers: any, data: any) {
	// 	try {
	// 		const config = {
	// 			method: method,
	// 			url: url,
	// 			headers: headers,
	// 			data: data,
	// 		};
	// 		return (await axios(config)).data;
	// 	} catch (error) {
	// 		console.log("error ::: ", error);
	// 		return false;
	// 	}
	// },
	getRandomArbitrary: function (min: number, max: number): number {
		return Math.floor(Math.random() * (max - min)) + min;
	},
	removeAccent: function (str: string): string {
		str = str.replace(/á|à|ả|ã|ạ|ă|ắ|ặ|ằ|ẳ|ẵ|â|ấ|ầ|ẩ|ẫ|ậ|Á|À|Ả|Ã|Ạ|Ă|Ắ|Ặ|Ằ|Ẳ|Ẵ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ/g, "a");
		str = str.replace(/đ|Đ/g, "d");
		str = str.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ|É|È|Ẻ|Ẽ|Ẹ|Ê|Ế|Ề|Ể|Ễ|Ệ/g, "e");
		str = str.replace(/í|ì|ỉ|ĩ|ị|Í|Ì|Ỉ|Ĩ|Ị/g, "i");
		str = str.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ|Ó|Ò|Ỏ|Õ|Ọ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ/g, "o");
		str = str.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự|Ú|Ù|Ủ|Ũ|Ụ|Ư|Ứ|Ừ|Ử|Ữ|Ự/g, "u");
		str = str.replace(/ý|ỳ|ỷ|ỹ|ỵ|Ý|Ỳ|Ỷ|Ỹ|Ỵ/g, "y");
		str = str.replace(/\s+/g, "-");
		str = str.replace(/[^\w+]/g, "-");
		str = str.replace(/_+/g, "-");
		return str;
	},
	typeValue: function (value: any): string {
		return Object.prototype.toString.call(value).slice(8, -1);
	},
	objectToQueryString: (obj: any) =>
		Object.keys(obj)
			.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
			.join("&"),
	deepFlatten: (arr: any) =>
		[].concat(...arr.map((v: any) => (Array.isArray(v) ? helper.deepFlatten(v) : v))),
	fromCamelCase: (str: string, separator = "_") =>
		str
			.replace(/(\[a-z\\d\])(\[A-Z\])/g, "$1" + separator + "$2")
			.replace(/(\[A-Z\]+)(\[A-Z\]\[a-z\\d\]+)/g, "$1" + separator + "$2")
			.toLowerCase(),
	isAbsoluteURL: (str: string) => /^\[a-z\]\[a-z0-9+.-\]\*:/.test(str),
	getDaysDiffBetweenDates: (dateInitial: any, dateFinal: any) =>
		(dateFinal - dateInitial) / (1000 * 3600 * 24),
	uniqueElementsBy: (arr: any, fn: (v: any, x: any) => any) =>
		arr.reduce((acc: any, v: any) => {
			if (!acc.some((x: any) => fn(v, x))) acc.push(v);
			return acc;
		}, []),
};

export default helper;
