export interface UserEntity {
	_id?: string | any;
	name?: string;
	email: string;
	avatar?: string;
	phone?: string;
	password?: string | any;
	status?: string;
	emailVerify?: boolean;
	typeLogin?: string;
	uid?: string;
	language: string;
	createdAt?: Date;
	updatedAt?: Date;
	country?: string;
	ip?: string;
}

export interface UpdateParams {
	name?: string;
	avatar?: string;
	phone?: string;
	updatedAt?: Date;
}

export interface UserToken extends UserEntity {
	token?: string;
	refreshToken?: string;
}

export interface UserMeta {
	id: string;
	email: string;
}

export interface Meta {
	token: string;
	user: UserMeta;
}

export interface AuthParams {
	email: string;
	password: string;
	name?: string;
	canvaToken?: string;
	nonce?: string;
}

export interface LoginSocialParams {
	accessToken: string;
	canvaToken?: string;
	nonce?: string;
}

export interface ForgotPasswordParams {
	email: string;
}

export interface ResetPasswordParams {
	email: string;
	password: string;
	code: string;
}

export interface ChangePasswordParams {
	oldPassword: string;
	newPassword: string;
}

export interface VerifyEmailParams {
	code: string;
	email: string;
}

export interface RefreshToken {
	token: string;
}
