export * from "./admin.interface";
export * from "./email.interface";
export * from "./language.interface";
export * from "./otp.interface";
export * from "./setting.interface";
export * from "./user.interface";

export interface User {
	role: number;
}

export interface Meta {
	userAgent?: string | null | undefined;
	user: User;
}

export interface MinioUpload {
	metaData: any;
	bucket: string;
	fileName: string;
	filePath: string;
	pathFileName: string;
}
