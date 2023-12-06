export interface OtpEntity {
	_id?: string;
	email?: string;
	phone?: string;
	type?: string;
	time?: Date;
	code?: string | any;
}

export interface GeneratorOtpParams {
	email?: string;
	phone?: string;
	type: string;
	code?: string | any;
}
