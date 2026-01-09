import { BadRequestException, Controller, Param, Get, Post, UploadedFile, UseInterceptors, Res  } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { fileFilter, fileNamer } from './helpers';

@Controller('files')  
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService:ConfigService
  ) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file', { 
    fileFilter: fileFilter,
    // limits: { fileSize: 1024 * 1024 * 5 } 
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer
    })
  }))
  uploadProductImage( @UploadedFile() file: Express.Multer.File ) {

    if ( !file ) throw new BadRequestException('Make sure that the file is an image');


    const secureUrl = `${this.configService.get('HOST_API')}/files/product/${file.filename }`;

    return { secureUrl };
  }

  @Get('product/:imageName')
  findProductImage( @Param('imageName' ) imageName: string, @Res() res: Response ) {
    const path = this.filesService.getStaticProductImage(imageName);
    res.sendFile(path);
  }
}
