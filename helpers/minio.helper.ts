import { MinioUpload } from "./../interfaces/index";
import fs from "fs";
const Minio = require("minio");

const MINIO = new Minio.Client({
	endPoint: process.env.MINIO_END_POINT,
	port: 443,
	useSSL: true,
	accessKey: process.env.MINIO_ACCESS_KEY,
	secretKey: process.env.MINIO_SECRET_KEY,
});

export const minioDelete = (ctx: any, url: string): any => {
	const MINIO_URL: string = process.env.MINIO_URL || "";
	if (url.search(MINIO_URL) === -1) return;
	const path = url.slice(MINIO_URL.length + 1);
	const c = path.indexOf("/");
	const bucketName = path.slice(0, c);
	const objectName = path.slice(c + 1);
	MINIO.removeObject(bucketName, objectName, function (err: any) {
		if (err) {
			console.error("Lỗi khi xóa file:", err, url);
		} else {
			console.log("File đã được xóa thành công", url);
		}
	});
};

export const minioUploadFile = async (
	ctx: any,
	{ metaData, bucket, fileName, filePath, pathFileName }: MinioUpload,
) => {
	return new Promise((resolve, reject) => {
		const file: any = ctx.meta;
		MINIO.fPutObject(bucket, pathFileName, filePath, metaData, (err: any, etag: any) => {
			if (err) {
				fs.unlinkSync(filePath);
				console.log("ERROR upload fail ::: ", err);
				reject(err);
			}
			fs.unlinkSync(filePath);
			console.log("file uploaded successfully:", etag);
			const path = `${process.env.MINIO_URL}/${bucket}/${pathFileName}`;
			console.log("================>>>: path : ", path);
			const result = {
				path: path,
				mimetype: file.mimetype,
				name: fileName,
			};
			resolve(result);
		});
	});
};

export const minioUploadObject = async ({ bucket, pathFileName, data }: any) => {
	return new Promise((resolve, reject) => {
		MINIO.putObject(bucket, pathFileName, data, (err: any, etag: any) => {
			if (err) {
				console.log("upload failed error ::: ", err);
				reject(err);
			}
			console.log("file uploaded successfully:", etag);
			const path = `${process.env.MINIO_URL}/${bucket}/${pathFileName}`;
			console.log("================>>>: path : ", path);
			resolve({ path });
		});
	});
};
