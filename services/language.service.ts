("use strict");
import { Context, Service, ServiceBroker } from "moleculer";

import { LanguageEntity, getLanguageParams } from "../interfaces";
import DbMixin from "../mixins/db.mixin";

export default class EmailService extends Service<any> {
	constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: "language",
			mixins: [DbMixin("language")],
			settings: {
				fields: ["_id", "locale", "name", "image", "sort", "status"],
				entityValidator: {},
				indexes: [{ locale: 1 }],
			},
			actions: {
				create: {
					rest: {
						method: "POST",
						path: "/create",
					},
					params: {
						name: { type: "string" },
						locale: { type: "string" },
						sort: { type: "number" },
					},
					handler: this.create,
				},
				getOne: {
					cache: {
						keys: ["locale"],
						ttl: 6000,
					},
					rest: {
						method: "GET",
						path: "/get",
					},
					params: {
						locale: { type: "string" },
					},
					handler: this.getOne,
				},
				list: {
					cache: {
						keys: ["id"],
						ttl: 6000,
					},
					rest: {
						method: "GET",
						path: "/list",
					},
					params: {
						id: { type: "string", optional: true },
					},
					handler: this.getList,
				},
			},
			methods: {},
		});
	}

	async create(ctx: Context<any, any>) {
		const data: LanguageEntity = {
			...ctx.params,
			image: "",
			status: "active",
		};
		return await this._create(ctx, data);
	}

	async getOne(ctx: Context<getLanguageParams>) {
		const { locale } = ctx.params;
		return await this.adapter.findOne({ locale });
	}

	async getList(ctx: Context<any, any>) {
		return await this._find(ctx, { query: { status: "active" }, sort: { sort: 1 } });
	}
}
