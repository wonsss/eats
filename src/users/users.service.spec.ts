import { Test } from '@nestjs/testing';
import { UserService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token'), // sign이 'signed-token'을 반환하도록 설정한다.
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
  sendVerificationSuccessEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>; // 타입 의미: Repository의 모든 키를 가져와서 그 키들을 Record의 키로 만들고, Record의 값은 jest.Mock로 만든다.

describe('UserService', () => {
  let service: UserService;
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
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
          useValue: mockJwtService(),
        },
        {
          provide: MailService, // MailService를 Mock Service로 대체한다.
          useValue: mockMailService(),
        },
      ],
    }).compile(); // 테스트 모듈을 컴파일한다.
    service = module.get<UserService>(UserService); // 테스트 모듈에서 UserService를 가져온다.
    usersRepository = module.get(getRepositoryToken(User)); // 테스트 모듈에서 User Repository를 가져온다.
    verificationsRepository = module.get(getRepositoryToken(Verification)); // 테스트 모듈에서 Verification Repository를 가져온다.
    mailService = module.get<MailService>(MailService); // 테스트 모듈에서 MailService를 가져온다.
    jwtService = module.get<JwtService>(JwtService); // 테스트 모듈에서 JwtService를 가져온다.
  });

  it('should be defined', () => {
    expect(service).toBeDefined(); // UserService가 정의되어 있어야 한다.
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@email.com',
      password: 'test_password',
      role: UserRole.Owner,
    };

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: UserRole.Client,
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

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
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

  describe('login', () => {
    const loginArgs = {
      email: '',
      password: '',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: 'user not found',
      });
    });

    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)), // checkPassword가 false를 반환하도록 설정한다.
      };
      usersRepository.findOne.mockResolvedValue(mockedUser); // findOne이 mockedUser를 반환하도록 설정한다.
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: 'wrong password',
      });
    });

    it('should return token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)), // checkPassword가 true를 반환하도록 설정한다.
      };
      usersRepository.findOne.mockResolvedValue(mockedUser); // findOne이 mockedUser를 반환하도록 설정한다.

      const result = await service.login({
        email: '',
        password: '',
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(1); // jwtService.sign이 1번 실행되었어야 한다.
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number)); // jwtService.sign이 Number 타입의 인자 1개를 받아 실행되었어야 한다.
      expect(result).toEqual({
        ok: true,
        token: expect.any(String), // token이 String 타입이어야 한다.
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: "Can't log user in." });
    });
  });

  describe('findById', () => {
    const findByIdArgs = {
      id: 1,
    };

    it('should find an existing user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(findByIdArgs.id);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it('should fail if no user is found', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(findByIdArgs.id);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    it('should change email', async () => {
      const oldUser = {
        email: 'bs@old.com',
        verified: true,
      };
      const editProfileArgs = {
        userId: 1,
        input: { email: 'bs@new.com' },
      };
      const newVerification = {
        code: 'code',
      };
      const newUser = {
        email: editProfileArgs.input.email,
        verified: false,
      };

      usersRepository.findOne.mockResolvedValue(oldUser);
      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);

      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        newVerification,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'new.password' },
      };

      usersRepository.findOne.mockResolvedValue({ password: 'old' });
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgs.input);
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: '12' });

      expect(result).toEqual({ ok: false, error: 'Could not update profile.' });
    });
  });

  describe('verifyEmail', () => {
    const code = 'code';

    it('should verify email', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      verificationsRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail(code);

      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith({
        where: { code },
        relations: ['user'],
      });
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ verified: true });

      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should fail on verification not found', async () => {
      verificationsRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail(code);
      expect(result).toEqual({ ok: false, error: 'Verification not found.' });
    });

    it('should fail on exception', async () => {
      verificationsRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail(code);
      expect(result).toEqual({ ok: false, error: 'Could not verify email.' });
    });
  });
});
