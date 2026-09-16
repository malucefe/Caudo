import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { NotFoundException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: jest.Mocked<Partial<Repository<Transaction>>>;

  const mockUserId = 'user-uuid-123';
  const mockTransactionId = 'tx-uuid-001';

  const mockTransaction: Partial<Transaction> = {
    id: mockTransactionId,
    userId: mockUserId,
    tipo: TransactionType.EGRESO,
    monto: 50000,
    categoriaId: 'cat-uuid-001',
    descripcion: 'Almuerzo',
    fecha: new Date('2026-06-03'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: repo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      tipo: TransactionType.EGRESO,
      monto: 50000,
      categoriaId: 'cat-uuid-001',
      descripcion: 'Almuerzo',
      fecha: '2026-06-03',
    };

    it('should create a transaction with correct userId and return saved entity', async () => {
      (repo.create as jest.Mock).mockReturnValue(mockTransaction);
      (repo.save as jest.Mock).mockResolvedValue(mockTransaction);
      (repo.findOne as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service.create(mockUserId, createDto);

      expect(repo.create).toHaveBeenCalledWith({
        ...createDto,
        userId: mockUserId,
      });
      expect(repo.save).toHaveBeenCalledWith(mockTransaction);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockTransactionId, userId: mockUserId },
        relations: ['category'],
      });
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findAll', () => {
    it('should return paginated results filtered by userId', async () => {
      const mockQueryBuilder: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [mockTransaction],
          1,
        ]),
      };

      (repo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUserId, 1, 20);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        't.userId = :userId',
        { userId: mockUserId },
      );
      expect(result).toEqual({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by type (ingreso/egreso)', async () => {
      const mockQueryBuilder: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      (repo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      await service.findAll(mockUserId, 1, 20, TransactionType.INGRESO);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        't.tipo = :tipo',
        { tipo: TransactionType.INGRESO },
      );
    });

    it('should filter by month/year', async () => {
      const mockQueryBuilder: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      (repo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      await service.findAll(mockUserId, 1, 20, undefined, 6, 2026);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        't.fecha BETWEEN :startDate AND :endDate',
        {
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        },
      );
    });
  });

  describe('findOne', () => {
    it('should return transaction by id and userId', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service.findOne(mockUserId, mockTransactionId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockTransactionId, userId: mockUserId },
        relations: ['category'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findOne(mockUserId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(mockUserId, 'non-existent'),
      ).rejects.toThrow('Transacción no encontrada');
    });
  });

  describe('update', () => {
    it('should update fields and return updated entity', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockTransaction);
      (repo.save as jest.Mock).mockResolvedValue(mockTransaction);

      const updateDto = { monto: 75000, descripcion: 'Almuerzo actualizado' };

      const result = await service.update(mockUserId, mockTransactionId, updateDto);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockTransactionId, userId: mockUserId },
        relations: ['category'],
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('remove', () => {
    it('should delete a transaction', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockTransaction);
      (repo.remove as jest.Mock).mockResolvedValue(mockTransaction);

      await service.remove(mockUserId, mockTransactionId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockTransactionId, userId: mockUserId },
        relations: ['category'],
      });
      expect(repo.remove).toHaveBeenCalledWith(mockTransaction);
    });
  });
});
