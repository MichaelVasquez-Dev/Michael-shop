import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {

    constructor(

        private readonly productsService: ProductsService,
    ) {}

    async runSeed() {
        await this.productsService.deleteAllProduct();


        const products = initialData.products;

        const insertPromises: Promise<any>[] = [];

        products.forEach(product => {
            insertPromises.push(this.productsService.create(product));
        });

        await Promise.all(insertPromises);

        return 'Seed executed';
    }

}
