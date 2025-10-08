import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DynamoService } from '../database/dynamo.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private readonly tableName: string;

  constructor(
    private readonly dynamo: DynamoService,
    private readonly configService: ConfigService,
  ) {
    this.tableName =
      this.configService.get<string>('DYNAMO_USERS_TABLE') || 'Users';
  }

  async create(createDto: {
    userId: string;
    email: string;
    name?: string;
    phoneNumber?: string;
  }) {
    if (!createDto.userId || !createDto.email) {
      throw new BadRequestException('userId and email required');
    }

    const item = {
      userId: createDto.userId,
      email: createDto.email,
      name: createDto.name || null,
      phoneNumber: createDto.phoneNumber || null,
      createdAt: new Date().toISOString(),
    };

    const condition = 'attribute_not_exists(userId)';

    await this.dynamo.createItem(this.tableName, item, condition);
    return item;
  }

  async findAll() {
    return await this.dynamo.scanTable(this.tableName);
  }

  async findOne(userId: string) {
    const item = await this.dynamo.getItem(this.tableName, { userId });
    if (!item) throw new NotFoundException('User not found');
    return item;
  }

  async update(userId: string, updates: Record<string, any>) {
    await this.findOne(userId); // ensure exist
    return await this.dynamo.updateItem(this.tableName, { userId }, updates);
  }

  async remove(userId: string) {
    await this.findOne(userId);
    return await this.dynamo.deleteItem(this.tableName, { userId });
  }

  async findByEmail(email: string) {
    const indexName = 'email-index';
    const res = await this.dynamo.queryByPK(this.tableName, 'email', email, {
      indexName,
    });
    return res.Items || [];
  }
}
