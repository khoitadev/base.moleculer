("use strict");
import { Context, Service, ServiceBroker, Errors } from "moleculer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import jwt_decode from "jwt-decode";

import Fetch from "../plugins/fetch.plugin";
import {
	UserEntity,
	UserToken,
	Meta,
	ForgotPasswordParams,
	ResetPasswordParams,
	AuthParams,
	LoginSocialParams,
	UpdateParams,
	RefreshToken,
	ChangePasswordParams,
} from "../interfaces";
import DbMixin from "../mixins/db.mixin";
import * as domainsJson from "../configs/domains.json";

const { MoleculerClientError } = Errors;
const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;
const JWT_SECRET_REFRESH_TOKEN = process.env.JWT_SECRET_REFRESH_TOKEN;
const domains: string[] = Object.values(domainsJson);

export default class UsersService extends Service<any> {
	constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: "user",
			mixins: [DbMixin("user")],
			settings: {
				rest: "/user",
				fields: [
					"_id",
					"name",
					"email",
					"avatar",
					"phone",
					"emailVerify",
					"createdAt",
					"updatedAt",
					"status",
					"language",
					"typeLogin",
					"ip",
					"country",
				],
				populates: {
					language: {
						action: "language.get",
						params: {
							fields: ["_id", "locale", "name"],
						},
					},
				},
				entityValidator: {},
				indexes: [{ email: 1 }],
			},
			actions: {
				register: {
					rest: {
						method: "POST",
						path: "/register",
					},
					params: {
						email: { type: "email" },
						password: { type: "string", min: 6 },
						name: { type: "string", min: 6 },
					},
					handler: this.register,
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
				loginGoogle: {
					rest: {
						method: "POST",
						path: "/login-google",
					},
					params: {
						accessToken: { type: "string" },
					},
					handler: this.loginGoogle,
				},
				loginFacebook: {
					rest: {
						method: "POST",
						path: "/login-facebook",
					},
					params: {
						accessToken: { type: "string" },
					},
					handler: this.loginFacebook,
				},
				refreshToken: {
					rest: {
						method: "POST",
						path: "/refresh-token",
					},
					params: {
						token: "string",
					},
					handler: this.refreshToken,
				},
				profile: {
					auth: "required",
					cache: {
						keys: ["#userId"],
					},
					rest: {
						method: "GET",
						path: "/profile",
					},
					handler: this.profile,
				},
				forgotPassword: {
					rest: {
						method: "POST",
						path: "/forgot-password",
					},
					params: {
						email: { type: "email" },
					},
					handler: this.forgotPassword,
				},
				resetPassword: {
					rest: {
						method: "PATCH",
						path: "/reset-password",
					},
					params: {
						email: { type: "email" },
						password: { type: "string", min: 6 },
						code: { type: "string" },
					},
					handler: this.resetPassword,
				},
				changePassword: {
					auth: "required",
					rest: {
						method: "PATCH",
						path: "/change-password",
					},
					params: {
						oldPassword: { type: "string" },
						newPassword: { type: "string" },
					},
					handler: this.changePassword,
				},
				updateMyself: {
					auth: "required",
					rest: {
						method: "PUT",
						path: "/update",
					},
					params: {
						name: {
							type: "string",
							optional: true,
							// pattern: /^[a-zA-Z0-9]+$/,
						},
						phone: { type: "string", optional: true },
						avatar: { type: "string", optional: true },
					},
					handler: this.updateMyself,
				},
				list: {
					cache: { ttl: 60 },
					rest: {
						method: "GET",
						path: "/list",
					},
					params: {},
					handler: this.getList,
				},
				sendMailOtp: {
					auth: "required",
					cache: { enabled: false },
					rest: {
						method: "GET",
						path: "/email",
					},
					params: {
						email: { type: "email" },
					},
					handler: this.sendMailOtp,
				},
				verifyEmail: {
					auth: "required",
					rest: {
						method: "PATCH",
						path: "/verify-email",
					},
					params: {
						email: { type: "email" },
						code: { type: "string" },
					},
					handler: this.verifyEmail,
				},
				getOne: {
					params: {
						email: { type: "string", optional: true },
					},
					handler: this.getOne,
				},
				getByEmail: {
					auth: "required",
					params: {
						email: { type: "string" },
					},
					handler: this.getByEmail,
				},
				updateLanguage: {
					auth: "required",
					rest: {
						method: "POST",
						path: "/update-language",
					},
					params: {
						locale: { type: "string" },
					},
					handler: this.updateLanguage,
				},
			},
			methods: {
				generateJWT(user: UserEntity, type: string | any = "token"): string {
					const expiresIn: string = type === "token" ? "30d" : "90d";
					const secret: string | any =
						type === "token" ? JWT_SECRET_TOKEN : JWT_SECRET_REFRESH_TOKEN;
					return jwt.sign(
						{
							id: user._id.toString(),
							email: user.email,
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
				transformEntity(user: UserToken, withToken: boolean) {
					if (withToken) {
						user.token = this.generateJWT(user, "token");
						user.refreshToken = this.generateJWT(user, "refresh-token");
					}
					return user;
				},
				async transformProfile(ctx: Context, user: any) {
					user.wallet = await ctx.call("wallet.getWallet", {
						userId: user._id.toString(),
					});
					return user;
				},
				encryptionPassword(password: string) {
					return bcrypt.hashSync(password, 10);
				},
				validatePassword(password: string, passwordUser: string) {
					return bcrypt.compareSync(password, passwordUser);
				},
				getNameFromEmail(email: string) {
					return email.slice(0, email.lastIndexOf("@"));
				},
				checkDomainValidByEmail(email: string): boolean {
					const domain = email.slice(email.lastIndexOf("@") + 1);
					return domains.includes(domain);
				},
			},
		});
	}

	async register(ctx: Context<AuthParams, any>): Promise<any> {
		const { password } = ctx.params;
		let { email } = ctx.params;
		email = email.trim().toLowerCase();
		if (this.checkDomainValidByEmail(email))
			throw new MoleculerClientError("email-is-invalid!", 409, "email-is-invalid!", {
				field: "email",
				message: "is invalid",
			});
		if (email) {
			const exist = await this.adapter.findOne({ email });
			if (exist)
				throw new MoleculerClientError("email-is-exist!", 409, "email-is-exist!", {
					field: "email",
					message: "is exist",
				});
		}

		let data: any = {
			...ctx.params,
			email,
			password: this.encryptionPassword(password),
			typeLogin: "default",
			uid: "",
			avatar: "",
			phone: "",
			emailVerify: false,
			language: ctx.meta.clientCountry === "VN" ? "vi" : "en",
			country: ctx.meta.clientCountry,
			ip: ctx.meta.clientIp,
			status: "active",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const newUser = await this._create(ctx, data);
		const json = await this.transformDocuments(ctx, {}, newUser);
		return await this.transformEntity(json, true);
	}

	async login(ctx: Context<AuthParams, any>): Promise<object> {
		const { password } = ctx.params;
		let { email } = ctx.params;
		email = email.trim().toLowerCase();
		const user: UserEntity = await this.adapter.findOne({ email });
		if (!user)
			throw new MoleculerClientError(
				"email-or-password-is-invalid!",
				422,
				"email-or-password-is-invalid!",
				{ field: "email", message: "is not found" },
			);
		const checkPassword = this.validatePassword(password, user.password);
		if (!checkPassword)
			throw new MoleculerClientError("wrong-password!", 422, "wrong-password!", {
				field: "password",
				message: "is not found",
			});

		const json = await this.transformDocuments(ctx, {}, user);
		return await this.transformEntity(json, true);
	}

	async loginGoogle(ctx: Context<LoginSocialParams, any>): Promise<object> {
		const { accessToken } = ctx.params;
		const dataGoogle: any = {};
		const dataSdk: any = await Fetch.get({
			path: `https://www.googleapis.com/oauth2/v2/tokeninfo?access_token=${accessToken}`,
		});
		if (dataSdk && dataSdk.user_id) {
			dataGoogle.uid = dataSdk.user_id;
			dataGoogle.email = dataSdk.email;
			dataGoogle.name = dataSdk.name || this.getNameFromEmail(dataSdk.email);
			dataGoogle.emailVerify = dataSdk.verified_email || false;
			dataGoogle.avatar = dataSdk.picture || "";
		}
		// login google popup
		else {
			const dataPopup: any = jwt_decode(accessToken);
			if (!dataPopup.sub && !dataSdk.user_id)
				throw new MoleculerClientError("google-login-failed!", 404, "google-login-failed!");

			dataGoogle.uid = dataPopup.sub;
			dataGoogle.email = dataPopup.email;
			dataGoogle.name = dataPopup.name || this.getNameFromEmail(dataPopup.email);
			dataGoogle.emailVerify = dataPopup.email_verified || false;
			dataGoogle.avatar = dataPopup.picture || "";
		}

		let user: UserEntity = await this.adapter.findOne({
			$or: [{ email: dataGoogle.email }, { uid: dataGoogle.uid, typeLogin: "google" }],
		});
		const firstLogin = !user;
		if (firstLogin) {
			const userData: UserEntity = {
				...dataGoogle,
				password: this.encryptionPassword(dataGoogle.uid),
				phone: "",
				typeLogin: "google",
				language: ctx.meta.clientCountry === "VN" ? "vi" : "en",
				country: ctx.meta.clientCountry,
				ip: ctx.meta.clientIp,
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			user = await this._create(ctx, userData);
		} else {
			let dataUpdate: any = {
				id: user._id.toString(),
				updatedAt: new Date(),
			};
			!user.uid && (dataUpdate.uid = dataGoogle.uid);
			user.typeLogin !== "google" && (dataUpdate.typeLogin = "google");
			if (!user.name && dataGoogle.name) dataUpdate.name = dataGoogle.name;
			user = await this._update(ctx, dataUpdate);
		}
		const json = await this.transformDocuments(ctx, {}, user);
		return await this.transformEntity(json, true);
	}

	async loginFacebook(ctx: Context<LoginSocialParams, any>): Promise<object> {
		const { accessToken } = ctx.params;
		const dataFacebook = await Fetch.get({
			path: `https://graph.facebook.com/me?fields=email,name,picture&access_token=${accessToken}`,
		});
		if (!dataFacebook.id)
			throw new MoleculerClientError("facebook-login-failed!", 404, "facebook-login-failed!");

		let user: UserEntity = await this.adapter.findOne({
			$or: [{ email: dataFacebook.email }, { uid: dataFacebook.id, typeLogin: "facebook" }],
		});
		const firstLogin = !user;
		if (firstLogin) {
			const userData: UserEntity = {
				email: dataFacebook.email || `${dataFacebook.id}@gmail.com`,
				name: dataFacebook.name || this.getNameFromEmail(dataFacebook.email) || dataFacebook.id,
				avatar: `https://graph.facebook.com/${dataFacebook.id}/picture?type=large&redirect=true&width=300&height=300`,
				phone: "",
				status: "active",
				emailVerify: false,
				typeLogin: "facebook",
				uid: dataFacebook.id,
				createdAt: new Date(),
				updatedAt: new Date(),
				language: ctx.meta.clientCountry === "VN" ? "vi" : "en",
				country: ctx.meta.clientCountry,
				ip: ctx.meta.clientIp,
			};
			user = await this._create(ctx, userData);
		} else {
			const dataUpdate: any = {
				id: user._id.toString(),
				updatedAt: new Date(),
			};
			!user.uid && (dataUpdate.uid = dataFacebook.id);
			user.typeLogin !== "facebook" && (dataUpdate.typeLogin = "facebook");
			user = await this._update(ctx, dataUpdate);
		}

		const json = await this.transformDocuments(ctx, {}, user);
		return await this.transformEntity(json, true);
	}

	async refreshToken(ctx: Context<RefreshToken>): Promise<object> {
		const { token } = ctx.params;
		const decode = this.validateToken(token, "refresh-token");
		if (!decode) throw new MoleculerClientError("token-invalid!", 401, "token-invalid!");
		return await this.transformEntity(decode, true);
	}

	async profile(ctx: Context<any, any>): Promise<object> {
		const { userId } = ctx.meta;
		const user: any = await this.adapter.findById(userId);
		return await this.transformProfile(ctx, user);
	}

	async forgotPassword(ctx: Context<ForgotPasswordParams, any>): Promise<any> {
		let { email } = ctx.params;
		email = email.trim().toLowerCase();

		const user: UserEntity | any = await this.adapter.findOne({ email });
		if (!user) throw new MoleculerClientError("user-not-found!", 404, "user-not-found!");

		const generator: any = await ctx.call("otp.generatorOtp", {
			email: email.trim().toLowerCase(),
			type: "forgot_password",
		});
		if (generator.status === "new") {
			ctx.emit("mail.send", {
				to: user.email,
				language: user.language,
				keyword: "forgot_password",
				name: user.name,
				codeOtp: generator.otp.code,
			});
		}

		return user;
	}

	async resetPassword(ctx: Context<ResetPasswordParams, any>): Promise<any> {
		const { password, code } = ctx.params;
		let { email } = ctx.params;
		email = email.trim().toLowerCase();

		let user: UserEntity = await this.adapter.findOne({ email });
		if (!user) throw new MoleculerClientError("user-not-found!", 404, "user-not-found!");

		const status: boolean = await ctx.call("otp.verify", {
			code,
			type: "forgot_password",
			email,
		});
		if (!status) throw new MoleculerClientError("code-not-verify!", 422, "code-not-verify!");

		user = await this._update(ctx, {
			id: user._id.toString(),
			password: this.encryptionPassword(password),
			updatedAt: new Date(),
		});

		return await this.transformDocuments(ctx, {}, user);
	}

	async changePassword(ctx: Context<ChangePasswordParams, any>): Promise<any> {
		let { oldPassword, newPassword } = ctx.params;
		const { userId } = ctx.meta;
		oldPassword = oldPassword.trim();
		newPassword = newPassword.trim();
		if (oldPassword === newPassword)
			throw new MoleculerClientError(
				"new-password-must-not-old-password!",
				422,
				"new-password-must-not-old-password!",
			);

		let user: UserEntity = await this.adapter.findById(userId);
		const validateOldPass = await this.validatePassword(oldPassword, user.password);
		if (!validateOldPass)
			throw new MoleculerClientError(
				"old-password-is-incorrect!",
				422,
				"old-password-is-incorrect!",
			);

		user = await this._update(ctx, {
			id: user._id.toString(),
			password: this.encryptionPassword(newPassword),
			updatedAt: new Date(),
		});

		return await this.transformDocuments(ctx, {}, user);
	}

	async updateMyself(ctx: Context<UpdateParams, any>) {
		const newData: UpdateParams = ctx.params;
		const { userId } = ctx.meta;
		newData.avatar && new URL(newData.avatar);
		newData.updatedAt = new Date();
		const update = {
			id: userId,
			...newData,
			updatedAt: new Date(),
		};
		const json = await this._update(ctx, update);

		return await this.transformDocuments(ctx, {}, json);
	}

	async getList(ctx: Context<UpdateParams, Meta>) {
		const users: UserEntity[] = await this._find(ctx, { populate: ["language"] });
		return await this.transformDocuments(ctx, ctx.params, users);
	}

	async sendMailOtp(ctx: Context<ForgotPasswordParams, any>): Promise<any> {
		let { email } = ctx.params;
		const { userId } = ctx.meta;
		email = email.trim().toLowerCase();

		const user: UserEntity | any = await this.adapter.findOne({ email });
		if (userId !== user._id.toString())
			throw new MoleculerClientError("email-invalid!", 422, "email-invalid!");

		if (user.emailVerify) throw new MoleculerClientError("email-verified!", 409, "email-verified!");

		const generator: any = await ctx.call("otp.generatorOtp", {
			email: email.trim().toLowerCase(),
			type: "verification_email",
		});
		if (generator.status === "new") {
			ctx.emit("mail.send", {
				to: user.email,
				keyword: "email_verify",
				language: user.language,
				name: user.name,
				codeOtp: generator.otp.code,
			});
		}

		return user;
	}

	async verifyEmail(ctx: Context<ResetPasswordParams, any>): Promise<any> {
		const { code } = ctx.params;
		const { userId } = ctx.meta;
		let { email } = ctx.params;
		email = email.trim().toLowerCase();

		let user: UserEntity = await this.adapter.findOne({ email });
		if (userId !== user._id.toString())
			throw new MoleculerClientError("email-invalid!", 422, "email-invalid!");

		const status: boolean = await ctx.call("otp.verify", {
			code,
			type: "verification_email",
			email,
		});
		if (!status) throw new MoleculerClientError("code-not-verify!", 422, "code-not-verify!");

		user = await this._update(ctx, {
			id: user._id.toString(),
			emailVerify: true,
			updatedAt: new Date(),
		});

		return await this.transformDocuments(ctx, {}, user);
	}

	async updatePremium(ctx: Context<any, any>) {
		const { userId, premium } = ctx.params;
		const user = await this._update(ctx, {
			id: userId.toString(),
			premium,
			updatedAt: new Date(),
		});

		return await this.transformDocuments(ctx, {}, user);
	}

	async getOne(ctx: Context<any, any>) {
		const { email } = ctx.params;
		const user = await this.adapter.findOne({ email });
		if (!user) throw new MoleculerClientError("unauthorized!", 401, "unauthorized!");
		return user;
	}

	async getByEmail(ctx: Context<any, any>) {
		const { email } = ctx.params;
		const user = await this.adapter.findOne({ email });
		return user;
	}

	async updateLanguage(ctx: Context<any, any>) {
		const { locale } = ctx.params;
		const { userId } = ctx.meta;
		const languageOne: any = await ctx.call("language.getOne", { locale });
		if (!languageOne)
			throw new MoleculerClientError("language-not-found!", 404, "language-not-found!");

		return await this._update(ctx, {
			id: userId,
			language: locale,
			updatedAt: new Date(),
		});
	}
}
