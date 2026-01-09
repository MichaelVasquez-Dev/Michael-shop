import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product, ProductImage } from './entities';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ){}

  async create(createProductDto: CreateProductDto) {
    try {

      const { images = [], ...productData } = createProductDto;

      const product = this.productRepository.create({
        ...productData,
        images: images.map(image => this.productImageRepository.create({ url: image }))
      });
      await this.productRepository.save(product);

      return {...product, images };

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {

      const { limit = 10, offset = 0 } = paginationDto;

      const products = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true
        }
      });

      return products.map(product => ({
        ...product,
        images: product.images?.map(image => image.url)
      }));
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(term: string) {
    try {
      let product: Product | null;

      if ( isUUID(term) ) {
        product = await this.productRepository.findOneBy({ id: term });
      } else {
        const queryBuilder = this.productRepository.createQueryBuilder('prod');
        product = await queryBuilder.where('UPPER(title) = :title or slug = :slug', { title: term.toUpperCase(), slug: term.toLowerCase() }).leftJoinAndSelect('product.images', 'images').getOne();
      }

      if ( !product ) throw new NotFoundException(`Product with ${term} not found`);
      return {
        ...product,
        images: product.images?.map(image => image.url)
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { images = [], ...toUpdate } = updateProductDto;

      const product = await this.productRepository.preload({...toUpdate, id});

      if ( !product ) throw new NotFoundException(`Product with id ${id} not found`);

      if ( images.length  ) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map(image => this.productImageRepository.create({ url: image }));
      } else {

      }

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();



      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);
      await this.productRepository.delete(id);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException('Product already exists');
    
    this.logger.error(error);
    throw new InternalServerErrorException('Internal server error - Check server logs'); 
  }

  async deleteAllProduct() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
