import { StatusAdmin } from "../enums";

export interface AdminEntity {
	_id?: string;
	name: string;
	email: string;
	password: string;
	status: StatusAdmin;
	role: string;
	createdAt?: Date;
	updatedAt?: Date;
}
