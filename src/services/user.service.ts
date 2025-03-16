import { User } from '../models/user.model';
import { IUser, IUserCreate, IUserLogin } from '../interfaces/user.interface';
import { AuthService } from './auth.service';
import bcrypt from 'bcryptjs';

export class UserService {
  private static instance: UserService;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private toUserResponse(user: User): IUser {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  public async register(userData: IUserCreate): Promise<User> {
    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username: userData.username } });
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Create new user - password will be hashed by model hooks
    return User.create({
      name: userData.name,
      username: userData.username,
      password: userData.password
    });
  }

  public async login(loginData: IUserLogin): Promise<{ accessToken: string }> {
    const user = await User.findOne({ where: { username: loginData.username } });
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    const userResponse = this.toUserResponse(user);
    const accessToken = await this.authService.generateAccessToken(userResponse);

    return { accessToken };
  }

  public async getUserById(userId: number): Promise<IUser | null> {
    const user = await User.findByPk(userId);
    return user ? this.toUserResponse(user) : null;
  }

  public async getUserByUsername(username: string): Promise<IUser | null> {
    const user = await User.findOne({ where: { username } });
    return user ? this.toUserResponse(user) : null;
  }
}
