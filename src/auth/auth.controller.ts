import { Controller, Post, Body, Get, UseGuards, Req, Headers, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { RawHeaders } from './decorators/raw.decorator';
import type { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RoleProtected } from './decorators/role-protected.decorator';
import { ValidRoles } from './interfaces';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('signin')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-auth-status')
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard('jwt'))
  testingPrivateRoute(
    // @Req() req: Request  
    // @Headers() headers: IncomingHttpHeaders,
    @GetUser() user: User,
    @GetUser('email') email: string,
    @RawHeaders() rawHeaders: string[],

  ) {
    // console.log(req['user']);   // Se debe usar @Req() req: Request

    return {
      message: 'I am a private route',
      user,
      email,
      rawHeaders,
      // headers, // Se debe usar @Headers() headers: IncomingHttpHeaders
    };
  }


  //USO DE UNGUARD Y METADATA PARA VERIFICAR ROLES DE USUARIO.
  @Get('private2')
  @SetMetadata('roles', ['admin', 'super-user']) // metodo antiguo de setear roles
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  testingPrivateRoute2( 
    @GetUser() user: User,
  ) {

    return {
      user,
    };
  }



  @Get('private3')
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin) //es igual que el metodo antiguo de setear roles pero permite usar constantes y enum quedando mas explicito
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  testingPrivateRoute3( 
    @GetUser() user: User,
  ) {

    return {
      user,
    };
  }




  @Get('private4')
  @Auth(ValidRoles.superUser)
  testingPrivateRoute4(@GetUser() user: User ) {
    return {
      user,
    };
  }
}
