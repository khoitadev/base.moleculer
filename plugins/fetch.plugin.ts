import qs from "qs";
import fetch from "node-fetch";
import Helper from "../helpers/index";

type QueryGet = {
	path: string;
	headers?: any;
	params?: any;
};
type QueryPost = {
	path: string | undefined;
	headers?: any;
	data?: any;
};

class Fetch {
	static async get({ path, headers, params }: QueryGet): Promise<any> {
		try {
			headers = Object.assign({ "Content-Type": "application/json" }, headers);
			return (
				await fetch(`${path}${params ? `?${qs.stringify(params)}` : ""}`, {
					method: "GET",
					headers: headers,
				})
			).json();
		} catch (error) {
			console.log("get error ::: ", error);
		}
	}

	static async post({ path, headers, data }: QueryPost): Promise<any> {
		try {
			let body = data;
			if (Helper.typeValue(data) === "Object") body = JSON.stringify(body);
			headers = Object.assign({ "Content-Type": "application/json" }, headers);
			return (
				await fetch(`${path}`, {
					method: "POST",
					headers: headers,
					body: body,
				})
			).json();
		} catch (error) {
			console.log("post error ::: ", error);
		}
	}

	static async put({ path, headers, data }: QueryPost): Promise<any> {
		try {
			headers = Object.assign({ "Content-Type": "application/json" }, headers);
			return (
				await fetch(`${path}`, {
					method: "PUT",
					headers: headers,
					body: JSON.stringify(data),
				})
			).json();
		} catch (error) {
			console.log("put error ::: ", error);
		}
	}

	static async patch({ path, headers, data }: QueryPost): Promise<any> {
		try {
			headers = Object.assign({ "Content-Type": "application/json" }, headers);
			return (
				await fetch(`${path}`, {
					method: "PATCH",
					headers: headers,
					body: JSON.stringify(data),
				})
			).json();
		} catch (error) {
			console.log("patch error ::: ", error);
		}
	}
}

export default Fetch;
