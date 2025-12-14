import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { UpdateShortUrlDto } from './dto/update-short-url.dto';

@Injectable()
export class UrlShortenerService {
  constructor(private readonly prisma: PrismaService) { }

  // Helper to generate unique ID
  private generateShortId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = Number(process.env.LENGHT) || 8; // Length of the short ID
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
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

  async updateShortUrl(shortUrlId: string, updateDto: UpdateShortUrlDto) {
    // Check if exists
    const existing = await this.prisma.shortUrl.findUnique({
      where: { shortUrlId },
    });

    if (!existing) {
      throw new NotFoundException('Short URL not found');
    }

    // Update
    return this.prisma.shortUrl.update({
      where: { shortUrlId },
      data: {
        ...updateDto,
        expiryDate: updateDto.expiryDate ? new Date(updateDto.expiryDate) : undefined,
        updateOn: new Date(), // Manually update the timestamp
      },
    });
  }

  async checkAvailability(shortUrlId: string) {
    const existing = await this.prisma.shortUrl.findUnique({
      where: { shortUrlId },
    });

    // If 'existing' is found, it is taken (Available = false)
    // If 'existing' is null, it is free (Available = true)
    return {
      shortUrlId,
      isAvailable: !existing,
    };
}
}