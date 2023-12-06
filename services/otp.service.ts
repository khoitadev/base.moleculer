("use strict");
import { Context, Service, ServiceBroker } from "moleculer";

import { OtpEntity, GeneratorOtpParams } from "../interfaces";
import DbMixin from "../mixins/db.mixin";

export default class EmailService extends Service<any> {
	constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: "otp",
			mixins: [DbMixin("otp")],
			settings: {
				fields: ["_id", "code", "email", "type", "time"],
				entityValidator: {},
			},
			actions: {
				generatorOtp: {
					params: {
						email: { type: "email" },
						phone: { type: "string", min: 10, optional: true },
						type: { type: "string" },
					},
					handler: this.generatorOtp,
				},
				verify: {
					params: {
						email: { type: "email" },
						phone: { type: "string", min: 10, optional: true },
						type: { type: "string" },
						code: { type: "string" },
					},
					handler: this.verify,
				},
				hasOtp: {
					rest: {
						method: "POST",
						path: "/check",
					},
					params: {
						email: { type: "email" },
						phone: { type: "string", min: 10, optional: true },
						code: { type: "string" },
					},
					handler: this.hasOtp,
				},
			},
			methods: {
				generateCode(): string {
					const stringOtp = "0123456789";
					let otp = "";
					for (let i = 0; i < 6; i++) {
						otp += stringOtp.charAt(Math.floor(Math.random() * 10));
					}
					return otp;
				},
			},
		});
	}

	async generatorOtp(ctx: Context<GeneratorOtpParams>): Promise<object> {
		const { email, phone, type } = ctx.params;
		const options: OtpEntity = {
			type,
		};
		email && (options.email = email);
		phone && (options.phone = phone);

		const exist: OtpEntity = await this.adapter.findOne(options);
		if (exist)
			return {
				status: "exist",
				otp: exist,
			};

		const otp = this.generateCode();
		options.code = otp;
		options.time = new Date();
		const newOtp = await this._create(ctx, options);

		return {
			status: "new",
			otp: newOtp,
		};
	}

	async hasOtp(ctx: Context<GeneratorOtpParams>): Promise<boolean> {
		const { code, email, type = "forgot_password", phone }: GeneratorOtpParams = ctx.params;
		const options: GeneratorOtpParams = {
			type,
			code,
		};
		email && (options.email = email);
		phone && (options.phone = phone);

		const exist: OtpEntity = await this.adapter.findOne(options);
		return code === exist?.code;
	}

	async verify(ctx: Context<GeneratorOtpParams>): Promise<boolean> {
		const { code, type, email, phone }: GeneratorOtpParams = ctx.params;
		const options: GeneratorOtpParams = {
			type,
			code,
		};
		email && (options.email = email);
		phone && (options.phone = phone);

		const exist: OtpEntity = await this.adapter.findOne(options);
		if (exist) {
			await this._remove(ctx, { id: exist._id?.toString() });
			return code === exist.code;
		}
		return false;
	}
}
