import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';

@Injectable()
export class UrlShortenerService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to generate unique ID
  private generateShortId(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  async shortenUrl(dto: CreateShortUrlDto) {
    const { longUrl, uriName, expiryDate, userName, email } = dto;

    // 1. Generate the unique Short ID
    let shortUrlId = this.generateShortId();

    // Check for collision (ensure ID is unique)
    let isUnique = false;
    while (!isUnique) {
      const existing = await this.prisma.shortUrl.findUnique({
        where: { shortUrlId },
      });
      if (!existing) isUnique = true;
      else shortUrlId = this.generateShortId();
    }

    // 2. Construct the full Short URL
    // (Adjust 'localhost:3000' to your actual domain in production)
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000/url';
    const fullShortUrl = `${baseUrl}/${shortUrlId}`;

    // 3. Save to Database using your specific schema fields
    return this.prisma.shortUrl.create({
      data: {
        longUrl,
        shortUrlId,
        shortUrl: fullShortUrl,
        uriName: uriName || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        userName: userName || null,
        email: email || null,
        createdBy: userName || 'system', // Defaulting createdBy to userName if present
      },
    });
  }

  async getLongUrl(shortUrlId: string) {
    const urlRecord = await this.prisma.shortUrl.findUnique({
      where: { shortUrlId },
    });

    if (!urlRecord) {
      throw new NotFoundException('Short URL not found');
    }

    // Check Expiry (if expiryDate is set)
    if (urlRecord.expiryDate && new Date() > urlRecord.expiryDate) {
      throw new BadRequestException('This Short URL has expired');
    }

    return urlRecord.longUrl;
  }

  async getUrlDetails(shortUrlId: string) {
    const urlRecord = await this.prisma.shortUrl.findUnique({
      where: { shortUrlId },
    });

    if (!urlRecord) {
      throw new NotFoundException('Short URL not found');
    }

    return urlRecord;
  }

  // Inside UrlShortenerService class

  async deleteShortUrl(shortUrlId: string) {
    // Check if it exists first
    const existing = await this.prisma.shortUrl.findUnique({
      where: { shortUrlId },
    });

    if (!existing) {
      throw new NotFoundException('Short URL not found');
    }

    // Delete the record
    await this.prisma.shortUrl.delete({
      where: { shortUrlId },
    });

    return { message: 'URL deleted successfully', shortUrlId };
  }
}
