import { Test } from '@nestjs/testing';
import { UserService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>; // 타입 의미: Repository의 모든 키를 가져와서 그 키들을 Record의 키로 만들고, Record의 값은 jest.Mock로 만든다.

describe('UserService', () => {
  let service: UserService;
  let usersRepository: MockRepository<User>;

  beforeAll(async () => {
    // 역할: 테스트 모듈을 만들어서 테스트 모듈을 통해 테스트를 진행한다.
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User), // User Repository를 Mock Repository로 대체한다.
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Verification), // Verification Repository를 Mock Repository로 대체한다.
          useValue: mockRepository,
        },
        {
          provide: JwtService, // JwtService를 Mock Service로 대체한다.
          useValue: mockJwtService,
        },
        {
          provide: MailService, // MailService를 Mock Service로 대체한다.
          useValue: mockMailService,
        },
      ],
    }).compile(); // 테스트 모듈을 컴파일한다.
    service = module.get<UserService>(UserService); // 테스트 모듈에서 UserService를 가져온다.
    usersRepository = module.get(getRepositoryToken(User)); // 테스트 모듈에서 User Repository를 가져온다.
  });

  it('should be defined', () => {
    expect(service).toBeDefined(); // UserService가 정의되어 있어야 한다.
  });

  describe('createAccount', () => {
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount({
        email: '',
        password: '',
        role: 0,
      });
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });
  });
});
