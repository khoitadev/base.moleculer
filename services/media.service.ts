("use strict");
import { Context, Service, ServiceBroker } from "moleculer";
import fs from "fs";
import path from "path";
import { mkdirp } from "mkdirp";

import Helper from "../helpers/index";
import cloudinary from "../plugins/upload-plugin";

const MEDIA_PUBLISH = process.env.MEDIA_PUBLISH;
const CLOUD_NAME = process.env.CLOUD_NAME;
const uploadDir = path.join(__dirname, "../public/media");
mkdirp.sync(uploadDir);

export default class MediaService extends Service<any> {
	constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: "media",
			// mixins: [DbMixin("media")],
			settings: {},
			actions: {
				upload: {
					auth: "required",
					handler: this.upload,
				},
			},
			methods: {
				randomName() {
					return "image_" + Date.now() + ".jpg";
				},
			},
		});
	}

	async upload(ctx: Context<any, any>): Promise<any> {
		return new this.Promise((resolve, reject) => {
			let filename = Helper.generateFileName(ctx.meta.filename) || this.randomName();
			const filePath = path.join(uploadDir, filename);
			const f = fs.createWriteStream(filePath);
			f.on("close", async () => {
				const file: any = ctx.meta;
				const data = await cloudinary.uploader.upload(filePath);
				const reg = new RegExp(`/upload/(v[0-9]+)/(${data.public_id}.*)`);
				const regExec: any = reg.exec(data.url);
				const path = `${MEDIA_PUBLISH}/media/${CLOUD_NAME}/uid/${regExec[1]}/${regExec[2]}`;
				fs.unlinkSync(filePath);

				const result = {
					path: path,
					mimetype: file.mimetype,
					name: filename,
				};
				resolve(result);
			});

			ctx.params.on("error", (err: any) => {
				console.log("File error received", err.message);
				reject(err);
				f.destroy(err);
			});

			f.on("error", () => {
				fs.unlinkSync(filePath);
			});
			ctx.params.pipe(f);
		});
	}
}
