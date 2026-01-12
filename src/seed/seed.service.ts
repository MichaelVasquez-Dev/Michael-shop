import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { User } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {

    constructor(

        private readonly productsService: ProductsService,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async runSeed() {
        await this.deleteTables();
        await this.createUsers();
        await this.createProducts();

        return 'Seed executed';
    }

    private async deleteTables() {
        await this.productsService.deleteAllProduct();

        await this.userRepository.createQueryBuilder().delete().execute();
    }

    private async createUsers() {
        const seedUsers = initialData.users;
        const users: User[] = [];
        seedUsers.forEach(user => {
            user.password = bcrypt.hashSync(user.password, 10);
            users.push(this.userRepository.create(user));
        });
        const dbUsers = await this.userRepository.save(users);
        return dbUsers;
    }

    private async createProducts() { 
        const users = await this.userRepository.find();
        if (users.length === 0) {
            throw new Error('No users found. Users must be created before products.');
        }
        
        const products = initialData.products;
        const insertPromises: Promise<any>[] = [];
        
        // Usar el primer usuario disponible para todos los productos
        const adminUser = users[0];
        
        products.forEach(product => {
            insertPromises.push(this.productsService.create(product, adminUser));
        });
        await Promise.all(insertPromises);
    }

}
