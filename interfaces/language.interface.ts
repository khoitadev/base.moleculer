export interface getLanguageParams {
	locale: "string";
}

export interface LanguageEntity {
	_id?: string;
	image: string;
	locale: string;
	name: string;
	sort: number | string;
	status: number | string;
}
