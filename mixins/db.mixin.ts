import type { Context, Service, ServiceSchema } from "moleculer";
import type { DbAdapter, MoleculerDB } from "moleculer-db";
import DbService from "moleculer-db";
import MongoDbAdapter from "moleculer-db-adapter-mongo";
import * as dotenv from "dotenv";
dotenv.config();

export type DbServiceMethods = {
	seedDb?(): Promise<void>;
};

type DbServiceSchema = Partial<ServiceSchema> &
	Partial<MoleculerDB<DbAdapter>> & {
		collection?: string;
	};

export type DbServiceThis = Service & DbServiceMethods;

export default function createDbServiceMixin(collection: string): DbServiceSchema {
	const cacheCleanEventName = `cache.clean.${collection}`;

	const schema: DbServiceSchema = {
		mixins: [DbService],

		events: {
			async [cacheCleanEventName](this: DbServiceThis) {
				if (this.broker.cacher) {
					await this.broker.cacher.clean(`${this.fullName}.*`);
				}
			},
		},

		methods: {
			async entityChanged(type: string, json: unknown, ctx: Context): Promise<void> {
				await ctx.broadcast(cacheCleanEventName);
			},
		},

		// async started(this: DbServiceThis) {},
	};

	if (process.env.MONGO_URI) {
		schema.adapter = new MongoDbAdapter(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		schema.collection = collection;
	}

	return schema;
}
