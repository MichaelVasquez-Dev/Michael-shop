import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ){}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);

      return {
        ...user,
        token: this.getJwtToken({ email: user.email, id: user.id, roles: user.roles, fullname: user.fullname }),
      };

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async login(loginUserDto: LoginUserDto){
    try {
      const { password, email } = loginUserDto;

      const user = await this.userRepository.findOne({
        where: { email, isActive: true },
        select: { email: true, password: true, fullname: true, roles: true, id: true },
      });

      if ( !user || !bcrypt.compareSync(password, user.password) ) throw new UnauthorizedException('Credentials are not valid (email - password are not correct)');
      
      return {
        ...user,
        token: this.getJwtToken({ email: user.email, id: user.id, roles: user.roles, fullname: user.fullname }),
      };

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  checkAuthStatus(user: User) {

    const token = this.getJwtToken({ email: user.email, id: user.id, roles: user.roles, fullname: user.fullname });
    return {
      ...user,
      token,
    };
  }

  private getJwtToken( payload: JwtPayload ): string {
    return this.jwtService.sign( payload );
  }

  private handleDBExceptions(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    if (error.response?.statusCode?.toString() === '404') throw new NotFoundException(error.response.message);
    if (error.response?.statusCode?.toString() === '401') throw new UnauthorizedException(error.response.message);
    throw new InternalServerErrorException('Internal server error - Check server logs'); 
  }
}
