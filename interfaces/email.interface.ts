import { MailStatus } from "../enums";

export interface SendMailParams {
	codeForgotPassword?: "string";
	email?: "string";
	fullName?: "string";
	amount?: "string";
	codeOtp?: "string";
	keyword: "string";
	language: "string";
	to: "string";
}

export interface MailContent {
	vi: OptionContent;
	en: OptionContent;
}

export interface OptionContent {
	subject: string;
	body: string;
}

export interface MailTemplateEntity {
	_id?: string;
	name: string;
	content: MailContent;
	keyword: string;
	status: MailStatus;
	createdAt?: Date;
	updatedAt?: Date;
}
