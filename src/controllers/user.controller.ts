import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AccountService } from '../services/account.service';
import { IUser } from '../interfaces/user.interface';

export class UserController {
  private static instance: UserController;
  private userService: UserService;
  private accountService: AccountService;

  private constructor() {
    this.userService = UserService.getInstance();
    this.accountService = AccountService.getInstance();
  }

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, username, password } = req.body;

      // Validate required fields
      if (!name || !username || !password) {
        res.status(400).json({
          status: 'error',
          message: 'All fields are required'
        });
        return;
      }

      // Validate name format
      if (name.length < 2 || name.length > 100) {
        res.status(400).json({
          status: 'error',
          message: 'Name must be between 2 and 100 characters'
        });
        return;
      }

      const nameRegex = /^[a-zA-Z\s-]+$/;
      if (!nameRegex.test(name)) {
        res.status(400).json({
          status: 'error',
          message: 'Name can only contain letters, spaces, and hyphens'
        });
        return;
      }

      // Validate username format
      if (username.length < 3 || username.length > 50) {
        res.status(400).json({
          status: 'error',
          message: 'Username must be between 3 and 50 characters'
        });
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({
          status: 'error',
          message: 'Password must be at least 8 characters long'
        });
        return;
      }

      const user = await this.userService.register({ name, username, password });
      // Create a default EUR account for the user
      await this.accountService.createAccount({
        userId: user.id,
        currency: 'EUR'
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          id: user.id,
          name: user.name,
          username: user.username
        }
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Internal server error'
        });
      }
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          status: 'error',
          message: 'Username and password are required'
        });
        return;
      }

      const { accessToken } = await this.userService.login({ username, password });

      res.status(200).json({
        token: accessToken
      });
    } catch (error: any) {
      res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
  }

  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.getUserById(req.user.id);
      const accounts = await this.accountService.getAccountsByUserId(req.user.id);

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user?.id,
            name: user?.name,
            username: user?.username
          },
          accounts: accounts.map(account => ({
            id: account.id,
            accountNumber: account.accountNumber,
            currency: account.currency,
            balance: account.balance
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    // Since we're using JWT tokens, we don't need to do anything server-side
    // The client should remove the tokens from their storage
    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  }
}
