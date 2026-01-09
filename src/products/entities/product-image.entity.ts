import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Product } from ".";

@Entity({ name: 'product_images' })
export class ProductImage {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('text')
    url: string;

    @ManyToOne(
        () => Product,
        (product) => product.images,
        { onDelete: 'CASCADE' }
    ) 
    product: Product;

} 