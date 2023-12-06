("use strict");
import { Context, Service, ServiceBroker, Errors } from "moleculer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import DbMixin from "../mixins/db.mixin";
import { StatusAdmin } from "../enums";
import { AdminEntity } from "../interfaces";

const { MoleculerClientError } = Errors;
const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;
const JWT_SECRET_REFRESH_TOKEN = process.env.JWT_SECRET_REFRESH_TOKEN;

export default class SpeechService extends Service<any> {
	constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: "admin",
			mixins: [DbMixin("admin")],
			settings: {
				entityValidator: {},
				fields: ["name", "email", "role", "_id"],
			},
			actions: {
				create: {
					auth: "required",
					role: ["admin", "marketing"],
					rest: {
						method: "POST",
						path: "/create",
					},
					params: {
						name: { type: "string" },
						email: { type: "email" },
						password: { type: "string", min: 6 },
						role: { type: "enum", values: ["admin", "marketing", "partner"] },
					},
					handler: this.create,
				},
				login: {
					rest: {
						method: "POST",
						path: "/login",
					},
					params: {
						email: { type: "email" },
						password: { type: "string", min: 6 },
					},
					handler: this.login,
				},
			},
			methods: {
				generateJWT(admin: AdminEntity, type: string | any = "token"): string {
					const expiresIn: string = type === "token" ? "7d" : "30d";
					const secret: string | any =
						type === "token" ? JWT_SECRET_TOKEN : JWT_SECRET_REFRESH_TOKEN;
					return jwt.sign(
						{
							id: admin._id?.toString(),
							email: admin.email,
							role: admin.role,
						},
						secret,
						{
							expiresIn,
						},
					);
				},
				validateToken(token: string, type = "token"): any {
					const secret: string | any =
						type === "token" ? JWT_SECRET_TOKEN : JWT_SECRET_REFRESH_TOKEN;
					jwt.verify(token, secret, (err: any, decoded: any) => {
						if (err) return null;
						return decoded;
					});
				},
				encryptionPassword(password: string) {
					return bcrypt.hashSync(password, 10);
				},
				validatePassword(password: string, passwordUser: string) {
					return bcrypt.compareSync(password, passwordUser);
				},
				transformEntity(admin: any, withToken: boolean) {
					if (withToken) {
						admin.token = this.generateJWT(admin, "token");
						admin.refreshToken = this.generateJWT(admin, "refresh-token");
					}
					return admin;
				},
			},
		});
	}

	async create(ctx: Context<AdminEntity, any>): Promise<object> {
		const { email } = ctx.params;

		const exist = await this.adapter.findOne({ email: email.trim() });
		if (exist)
			throw new MoleculerClientError("email-is-exist!", 409, "email-is-exist!", {
				field: "email",
				message: "is exist",
			});

		const data: AdminEntity = {
			...ctx.params,
			status: StatusAdmin.Active,
			createdAt: new Date(),
			updatedAt: new Date(),
			password: this.encryptionPassword(ctx.params.password),
		};

		const json = await this._create(ctx, data);
		return this.transformDocuments(ctx, {}, json);
	}

	async login(ctx: Context<any, any>): Promise<object> {
		const { email, password } = ctx.params;

		const admin: AdminEntity = await this.adapter.findOne({ email });
		if (!admin)
			throw new MoleculerClientError(
				"email-or-password-is-invalid!",
				422,
				"email-or-password-is-invalid!",
				{ field: "email", message: "is not found" },
			);

		const checkPassword = this.validatePassword(password, admin.password);
		if (!checkPassword)
			throw new MoleculerClientError("wrong-password!", 422, "wrong-password!", {
				field: "password",
				message: "is not found",
			});

		const json = await this.transformDocuments(ctx, {}, admin);
		return await this.transformEntity(json, true);
	}
}
