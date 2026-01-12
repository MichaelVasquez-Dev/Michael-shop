export interface JwtPayload {
    email: string;
    id: string;
    roles: string[];
    fullname: string;
    iat?: number;
    exp?: number;
}