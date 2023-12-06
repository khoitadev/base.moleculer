("use strict");
import { Context, Service, ServiceBroker } from "moleculer";
import nodemailer from "nodemailer";

import DbMixin from "../mixins/db.mixin";
import { MailStatus } from "../enums";
import { MailTemplateEntity, OptionContent } from "../interfaces";

const MAIL_USERNAME = process.env.MAIL_USERNAME;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: MAIL_USERNAME,
		pass: MAIL_PASSWORD,
	},
});

export default class EmailService extends Service<any> {
	constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: "email",
			mixins: [DbMixin("email_template")],
			settings: {
				entityValidator: {},
				indexes: [{ keyword: 1 }],
			},
			events: {
				"mail.send": {
					params: {
						keyword: { type: "string" },
						language: { type: "string" },
						to: { type: "email" },
					},
					handler: this.sendMail,
				},
				"mail.sendMarketing": {
					params: {
						data: { type: "object" },
						to: { type: "email" },
						subject: { type: "string" },
						template: { type: "string" },
					},
					handler: this.sendMailMarketing,
				},
			},

			actions: {
				create: {
					auth: "required",
					rest: {
						method: "POST",
						path: "/create",
					},
					params: {
						content: {
							type: "object",
							props: {
								vi: { type: "object" },
								en: { type: "object" },
							},
						},
						name: { type: "string" },
						keyword: { type: "string" },
					},
					handler: this.create,
				},
				sendEmail: {
					params: {
						keyword: { type: "string" },
						language: { type: "string" },
						to: { type: "email" },
					},
					handler: this.sendMail,
				},
				sendEmailText: {
					rest: {
						method: "POST",
						path: "/send",
					},

					handler: this.sendMailText,
				},
				getList: {
					cache: true,
					rest: {
						method: "GET",
						path: "/list",
					},
					handler: this.getList,
				},
				getEmail: {
					cache: {
						keys: ["id"],
					},
					rest: {
						method: "GET",
						path: "/list/:id",
					},
					params: {
						id: { type: "string" },
					},
					handler: this.getEmailById,
				},
				updateEmail: {
					rest: {
						method: "PUT",
						path: "/update",
					},
					params: {
						id: { type: "string" },
						name: { type: "string" },
						content: {
							type: "object",
							props: {
								vi: { type: "object" },
								en: { type: "object" },
							},
						},
					},
					handler: this.updateEmail,
				},
			},
			methods: {
				generateTransporter() {
					const transporter = nodemailer.createTransport({
						service: "gmail",
						auth: {
							user: MAIL_USERNAME,
							pass: MAIL_PASSWORD,
						},
					});
					return transporter;
				},
				replaceContent(content: string, { email, name, codeOtp, amount }: any): string {
					return content.replace(/{{([^{}]+)}}/g, function (keyExpr: string, key: string) {
						switch (key) {
							case "CODE_OTP":
								return codeOtp;
							case "NAME":
								return name;

							case "EMAIL":
								return email;
							case "AMOUNT":
								return new Intl.NumberFormat("de-DE", {
									style: "currency",
									currency: "VND",
								}).format(amount);
						}
					});
				},
				sendMailMethod(mailOptions) {
					return transporter.sendMail(mailOptions, (error, info) => {
						if (error) {
							console.log("send mail error ::: ", error);
							return error;
						}
						console.log("send mail success : ", info);
						return info;
					});
				},
			},
		});
	}

	async create(ctx: Context<any, any>): Promise<object> {
		const data: MailTemplateEntity = {
			...ctx.params,
			status: MailStatus.Active,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		return await this._create(ctx, data);
	}

	async sendMail(ctx: Context<any, any>): Promise<any> {
		const { email, name, codeOtp, amount, keyword, language, to } = ctx.params;
		const template: MailTemplateEntity = await this.adapter.findOne({
			keyword: keyword,
		});
		const content: any = template.content;

		let { subject, body }: OptionContent = content[language];
		const dataReplace = {
			email,
			name,
			codeOtp,
			amount,
		};
		subject = this.replaceContent(subject, dataReplace);
		body = this.replaceContent(body, dataReplace);

		const mailOptions = {
			from: "moleculer@gmail.com>",
			to: to,
			subject,
			html: body,
		};

		return this.sendMailMethod(mailOptions);
	}
	sendMailText(ctx: Context<any, any>) {
		const { subject, text, to, from } = ctx.params;
		const mailOptions = {
			from: "moleculer@gmail.com>",
			to,
			subject,
			text,
		};
		return this.sendMailMethod(mailOptions);
	}

	async getList(ctx: Context<any, any>): Promise<object> {
		const { name } = ctx.params;
		const options: any = {
			fields: ["_id", "name", "keyword", "status", "type"],
		};
		name && (options.query = { name });
		return await this._find(ctx, options);
	}

	async getEmailById(ctx: Context<any, any>): Promise<object> {
		return await this.adapter.findById(ctx.params.id);
	}

	async updateEmail(ctx: Context<any, any>) {
		const { id, content, name } = ctx.params;
		const update = {
			id: id.toString(),
			content: content,
			name: name,
		};
		return await this._update(ctx, update);
	}
}
