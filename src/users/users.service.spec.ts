import { Test } from '@nestjs/testing';
import { UserService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

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
  let verificationsRepository: MockRepository<Verification>;
  let emailService: MailService;

  beforeAll(async () => {
    // 역할: 테스트 모듈을 만들어서 테스트 모듈을 통해 테스트를 진행한다.
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User), // User Repository를 Mock Repository로 대체한다.
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification), // Verification Repository를 Mock Repository로 대체한다.
          useValue: mockRepository(),
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
    verificationsRepository = module.get(getRepositoryToken(Verification)); // 테스트 모듈에서 Verification Repository를 가져온다.
    emailService = module.get<MailService>(MailService); // 테스트 모듈에서 MailService를 가져온다.
  });

  it('should be defined', () => {
    expect(service).toBeDefined(); // UserService가 정의되어 있어야 한다.
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@email.com',
      password: 'test_password',
      role: 0,
    };

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      // return value를 mocking한다.
      usersRepository.findOne.mockResolvedValue(undefined); // findOne이 undefined를 반환하도록 설정한다.
      usersRepository.create.mockReturnValue(createAccountArgs); // create가 createAccountArgs를 반환하도록 설정한다.
      usersRepository.save.mockResolvedValue(createAccountArgs); // save가 createAccountArgs를 반환하도록 설정한다.
      verificationsRepository.create.mockReturnValue(createAccountArgs); // create가 createAccountArgs를 반환하도록 설정한다.
      verificationsRepository.save.mockResolvedValue({ code: 'code' }); // save가 createAccountArgs를 반환하도록 설정한다.

      const result = await service.createAccount(createAccountArgs); // createAccount를 실행한다.

      expect(usersRepository.create).toHaveBeenCalledTimes(1); // create가 1번 실행되었어야 한다.
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs); // create가 createAccountArgs를 인자로 받아 실행되었어야 한다.

      expect(usersRepository.save).toHaveBeenCalledTimes(1); // save가 1번 실행되었어야 한다.
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs); // save가 createAccountArgs를 인자로 받아 실행되었어야 한다.

      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        createAccountArgs,
      );

      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      ); // sendVerificationEmail가 String 타입의 인자 2개를 받아 실행되었어야 한다.

      expect(result).toEqual({ ok: true }); // createAccount의 결과는 { ok: true }이어야 한다.
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error()); // findOne이 Error를 반환하도록 설정한다. save도 마찬가지.
      const result = await service.createAccount(createAccountArgs); // createAccount를 실행한다.
      expect(result).toEqual({ ok: false, error: "Couldn't create account" }); // createAccount의 결과는 { ok: false, error: "Couldn't create account" }이어야 한다.
    });
  });
});
