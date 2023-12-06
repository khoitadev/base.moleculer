"use strict";

export const CacheCleaner = function (serviceNames: string[]) {
	const events: any = {};

	serviceNames.forEach((name) => {
		events[`cache.clean.${name}`] = function () {
			if (this.broker.cacher) {
				this.logger.debug(`Clear local '${this.name}' cache`);
				this.broker.cacher.clean(`${this.name}.*`);
			}
		};
	});

	return {
		events,
	};
};
