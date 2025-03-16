export interface IUser {
  id: number;
  name: string;
  username: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword?(password: string): Promise<boolean>;
}

export interface IUserCreate {
  name: string;
  username: string;
  password: string;
}

export interface IUserLogin {
  username: string;
  password: string;
}

export interface IUserResponse {
  id: number;
  name: string;
  username: string;
  createdAt: Date;
}
