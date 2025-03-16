import { IUser } from './user.interface';

export interface IAccount {
  id: number;
  accountNumber: string;
  userId: number;
  currency: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
}

export interface IAccountCreate {
  currency: string;
  userId: number;
}

export interface IAccountBalance {
  accountNumber: string;
  currency: string;
  balance: number;
}
