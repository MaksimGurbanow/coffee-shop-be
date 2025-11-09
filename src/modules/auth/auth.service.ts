import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PaymentMethod, User } from '../../entities/user.entity';
import { LoginDto, RegisterDto, UpdateDto } from '../../common/dto/auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserPublicDto } from '../../common/dto/user.dto';
import { omit } from 'lodash';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.createInitialUser();
  }

  async createInitialUser() {
    const newUser = this.userRepository.create({
      id: 1,
      login: 'Admin',
      password: await bcrypt.hash('P@ssword', 10),
      city: 'Adana',
      street: 'Atatürk Caddesi',
      paymentMethod: PaymentMethod.CASH,
      houseNumber: 100,
    });
    await this.userRepository.save(newUser);
  }

  /**
   * Register new user
   */
  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: UserPublicDto }> {
    const {
      login,
      password,
      confirmPassword,
      city,
      street,
      houseNumber,
      paymentMethod,
    } = registerDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.userRepository.findOne({
      where: { login },
    });
    if (existingUser) {
      throw new ConflictException('User with this login already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = this.userRepository.create({
      login,
      password: hashedPassword,
      city,
      street,
      houseNumber,
      paymentMethod,
    });

    const savedUser = await this.userRepository.save(newUser);

    const payload: JwtPayload = {
      userId: savedUser.id,
      login: savedUser.login,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: omit(savedUser, 'password'),
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: UserPublicDto }> {
    const { login, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { login } });
    console.log(await this.userRepository.find());
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { userId: user.id, login: user.login };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: omit(user, 'password'),
    };
  }

  async update(
    updateDto: UpdateDto,
  ): Promise<{ user: UserPublicDto; access_token: string }> {
    const { login, ...dataToUpdate } = updateDto;

    // const user = await this.userRepository.findOne({ where: { login } });
    // if (!user) {
    //   throw new UnauthorizedException('Invalid credentials');
    // }

    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   throw new UnauthorizedException('Invalid credentials');
    // }
    console.log(login, dataToUpdate);
    await this.userRepository.update({ login }, dataToUpdate);

    const updatedUser = await this.userRepository.findOne({ where: { login } });

    const payload: JwtPayload = {
      userId: updatedUser.id,
      login: updatedUser.login,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: omit(updatedUser, 'password'),
    };
  }

  async validateUser(userId: number): Promise<UserPublicDto | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    return omit(user, 'password');
  }

  async getUserById(id: number): Promise<UserPublicDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    return omit(user, 'password');
  }
}
