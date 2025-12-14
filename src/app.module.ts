import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <--- Import these
import { JwtModule } from '@nestjs/jwt';
import { UrlShortenerModule } from './url-shortener/url-shortener.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    // 1. Load the ConfigModule globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    UrlShortenerModule,

    // 2. Use registerAsync to inject ConfigService
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}