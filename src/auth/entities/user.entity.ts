import { IsArray, IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Product } from "src/products/entities";
import { Column, Entity, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, OneToMany } from "typeorm";

@Entity({ name: 'users' })
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    @Column('text', { select: false })
    password: string;

    @Column('text')
    @IsNotEmpty()
    fullname: string;

    @Column('boolean', { default: true })
    isActive: boolean;

    @Column('text', { array: true, default: ['user'] })
    @IsArray()
    @IsString({ each: true })
    roles: string[];


    @OneToMany(
        () => Product,
        (product) => product.user,
    ) 
    products: Product[];


    @BeforeInsert()
    capitalizeEmail() {
        this.email = this.email.toLowerCase().trim();
    }
    
    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.capitalizeEmail();
    }
}
