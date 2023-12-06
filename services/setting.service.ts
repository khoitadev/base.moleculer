("use strict");
import { Context, Service, ServiceBroker } from "moleculer";

import DbMixin from "../mixins/db.mixin";
import { SettingEntity } from "../interfaces";

export default class SettingService extends Service<any> {
	constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: "setting",
			mixins: [DbMixin("setting")],
			settings: {
				entityValidator: {},
			},
			actions: {
				create: {
					// rest: {
					// 	method: "POST",
					// 	path: "/create",
					// },
					params: {},
					handler: this.create,
				},
				getOne: {
					cache: {
						ttl: 6000,
					},
					rest: {
						method: "GET",
						path: "/get",
					},
					params: {},
					handler: this.getOne,
				},
			},
			methods: {},
		});
	}

	async create(ctx: Context<SettingEntity, any>): Promise<object> {
		const data: SettingEntity = ctx.params;
		return await this._create(ctx, data);
	}

	async getOne(): Promise<object> {
		return await this.adapter.findOne({});
	}
}
