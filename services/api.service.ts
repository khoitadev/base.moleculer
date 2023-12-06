import type { Context, ServiceSchema } from "moleculer";
import type { ApiSettingsSchema, IncomingRequest, Route } from "moleculer-web";
import ApiGateway from "moleculer-web";
import jwt from "jsonwebtoken";

import { UserEntity } from "../interfaces";

const PORT = process.env.PORT;
const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;

const ApiService: ServiceSchema<ApiSettingsSchema> = {
	name: "api",
	mixins: [ApiGateway],
	metadata: {},
	settings: {
		port: PORT != null ? +PORT : 3000,
		secret: JWT_SECRET_TOKEN,
		ip: "0.0.0.0",
		cors: {
			origin: ["*"],
			methods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
			credentials: true,
			exposedHeaders: ["Content-Disposition"],
		},
		// middleware
		use: [],

		routes: [
			{
				path: "/api",
				whitelist: ["**"],
				use: [],
				mergeParams: true,
				authentication: true,
				authorization: true,
				autoAliases: true,
				aliases: {
					"POST /media/upload": "multipart:media.upload",
					"POST /file/upload": "multipart:file.minio",
				},
				bodyParsers: {
					json: { limit: "1MB" },
					urlencoded: { extended: true, limit: "1MB" },
				},
				busboyConfig: {
					limits: {
						files: 5,
					},
				},
				callingOptions: {},
				mappingPolicy: "all", // "all", "restrict"
				logging: true,
			},
			{
				path: "/public",
				aliases: {
					"GET /": "public",
				},
			},
		],
		log4XXResponses: true,
		logRequestParams: "info",
		assets: {
			folder: "public",
			options: {},
		},
	},

	methods: {
		async authenticate(ctx: Context<any, any>, route: Route, req: IncomingRequest): Promise<any> {
			if (!req.$action.auth) {
				return null;
			}
			const auth = req.headers.authorization || "Bearer ";
			const token = auth.slice(7);
			if (!token) {
				return null;
			}
			try {
				const decoded: any = jwt.verify(token, this.settings.secret);
				if (!decoded || !decoded.id) {
					return null;
				}
				return decoded;
			} catch (error) {
				return null;
			}
		},

		async authorize(ctx: Context<null, any>, route: Route, req: IncomingRequest) {
			ctx.meta.clientIp = req.headers["cf-connecting-ip"];
			ctx.meta.clientCountry = req.headers["cf-ipcountry"];
			const user: any = ctx.meta.user;

			if (req.$action.role && !req.$action.role.includes(user?.role)) {
				throw new ApiGateway.Errors.UnAuthorizedError("unauthorized!", {
					error: "permission-denied",
				});
			}
			if (req.$action.auth === "required") {
				if (!user) throw new ApiGateway.Errors.UnAuthorizedError("unauthorized!", null);
				if (!user.role) {
					const hasUser: UserEntity = await ctx.call("user.getOne", user);
					if (!hasUser) throw new ApiGateway.Errors.UnAuthorizedError("unauthorized!", null);
					ctx.meta.user = { email: hasUser.email, id: hasUser._id.toString() };
					ctx.meta.userId = hasUser._id.toString();
				}
			}
		},
	},
};

export default ApiService;
