import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { nombre: 'ASC' } });
  }

  async findByType(tipo: CategoryType): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { tipo },
      order: { nombre: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Category>): Promise<Category> {
    const category = this.categoriesRepository.create(data);
    return this.categoriesRepository.save(category);
  }

  async count(): Promise<number> {
    return this.categoriesRepository.count();
  }
}
