import { Test } from '@nestjs/testing';
import { UserService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';

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

describe('UserService', () => {
  let service: UserService;

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined(); // UserService가 정의되어 있어야 한다.
  });
});
