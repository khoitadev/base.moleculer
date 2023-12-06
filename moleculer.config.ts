import type { BrokerOptions, MetricRegistry } from "moleculer";
import { Errors } from "moleculer";
import * as config from "./configs/config.json";
import { logEvent } from "./helpers/log.helper";

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const { MoleculerClientError } = Errors;

const brokerConfig: BrokerOptions = {
	namespace: "aiwow",
	nodeID: "aiwow",
	metadata: {},
	hotReload: true,
	middlewares: [],
	logger: true,
	transporter: null, // "NATS"
	cacher: {
		type: "Redis",
		options: {
			ttl: 30,
			maxParamsLength: 100,
			redis: {
				host: REDIS_HOST,
				port: REDIS_PORT,
				password: REDIS_PASSWORD,
			},
		},
	},
	serializer: "JSON",
	requestTimeout: config.requestTimeout,
	retryPolicy: {
		// Enable feature
		enabled: false,
		// Count of retries
		retries: 5,
		// First delay in milliseconds.
		delay: 100,
		// Maximum delay in milliseconds.
		maxDelay: 1000,
		// Backoff factor for delay. 2 means exponential backoff.
		factor: 2,
		// A function to check failed requests.
		check: (err: Error) => err && err instanceof Errors.MoleculerRetryableError && !!err.retryable,
	},

	// Limit of calling level. If it reaches the limit, broker will throw an MaxCallLevelError error. (Infinite loop protection)
	maxCallLevel: 100,

	// Number of seconds to send heartbeat packet to other nodes.
	heartbeatInterval: 10,
	// Number of seconds to wait before setting node to unavailable status.
	heartbeatTimeout: 30,

	// Cloning the params of context if enabled. High performance impact, use it with caution!
	contextParamsCloning: false,

	// Disable built-in request & emit balancer. (Transporter must support it, as well.). More info: https://moleculer.services/docs/0.14/networking.html#Disabled-balancer
	disableBalancer: false,

	// Settings of Service Registry. More info: https://moleculer.services/docs/0.14/registry.html
	registry: {
		// Define balancing strategy. More info: https://moleculer.services/docs/0.14/balancing.html
		// Available values: "RoundRobin", "Random", "CpuUsage", "Latency", "Shard"
		strategy: "RoundRobin",
		// Enable local action call preferring. Always call the local action instance if available.
		preferLocal: true,
	},
	// Enable action & event parameter validation. More info: https://moleculer.services/docs/0.14/validating.html
	validator: true,

	errorHandler(err: any, info: any) {
		console.log("--------------- GLOBAL HANDLER ERROR ------------------");
		console.log(err);
		const { ctx }: any = info;
		const { originalUrl, url, method, rawHeaders }: any = ctx?.params?.req ?? {};
		const { type, code, message } = err;
		const data = ctx?.params?.req?.$params;
		const token = rawHeaders?.find((item: string) => item.startsWith("Bearer"));
		const contentLog = `URL : ${url}\nORIGIN URL: ${originalUrl}\nMETHOD: ${method}\nDATA: ${JSON.stringify(
			data,
		)}\nTOKEN: ${token}\nMESSAGE: ${
			message ?? type
		}\nCODE: ${code}\n======================== END LOG =========================`;

		url && logEvent(contentLog);
		throw new MoleculerClientError(message, code, type);
	},

	// Enable/disable built-in metrics function. More info: https://moleculer.services/docs/0.14/metrics.html
	metrics: {
		enabled: false,
		// Available built-in reporters: "Console", "CSV", "Event", "Prometheus", "Datadog", "StatsD"
		reporter: {
			type: "Console",
			options: {
				// HTTP port
				port: 3030,
				// HTTP URL path
				path: "/metrics",
				// Default labels which are appended to all metrics labels
				defaultLabels: (registry: MetricRegistry) => ({
					namespace: registry.broker.namespace,
					nodeID: registry.broker.nodeID,
				}),
			},
		},
	},

	tracing: {
		enabled: true,
		exporter: {
			type: "Console",
			options: {
				colors: true,
				width: 100,
				gaugeWidth: 40,
			},
		},
	},

	replCommands: null,

	// Called after broker created.
	// created(broker: ServiceBroker): void {},

	// Called after broker started.
	// async started(broker: ServiceBroker): Promise<void> {},

	// Called after broker stopped.
	// async stopped(broker: ServiceBroker): Promise<void> {},
};

export = brokerConfig;
