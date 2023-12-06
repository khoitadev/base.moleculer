("use strict");
import { Context, Service, ServiceBroker } from "moleculer";
import fs from "fs";
import path from "path";
import { mkdirp } from "mkdirp";
import { minioUploadFile } from "../helpers/minio.helper";

const uploadDir = path.join(__dirname, "../public/media");
mkdirp.sync(uploadDir);

export default class MediaService extends Service<any> {
	constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: "file",
			settings: {},
			actions: {
				minio: {
					auth: "required",
					handler: this.minio,
				},
			},
			methods: {},
		});
	}

	async minio(ctx: Context<any, any>): Promise<any> {
		const { bucket, contentType } = ctx.meta.$params;
		return new this.Promise((resolve: any, reject: any) => {
			const fileName = ctx.meta.filename;
			const filePath = path.join(uploadDir, fileName);
			const f = fs.createWriteStream(filePath);
			const metaData = {
				"Content-Type": contentType,
			};
			f.on("close", () => {
				minioUploadFile(ctx, {
					metaData,
					bucket,
					fileName,
					filePath,
					pathFileName: fileName,
				})
					.then((result: any) => {
						resolve(result);
					})
					.catch((error: any) => {
						reject(error);
					});
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
