import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import { User } from "../entities/user.entity";

export const GetUser = createParamDecorator((data, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();

    if(data === 'email') return req.user.email;
    

    const user = req.user;
    if ( !user ) throw new InternalServerErrorException('User not found in the request');
    return user;
});