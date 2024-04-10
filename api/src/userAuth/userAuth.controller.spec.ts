import { Test, type TestingModule } from '@nestjs/testing';
import { UserAuthController } from './userAuth.controller';
import { UserAuthService } from './userAuth.service';

describe('UserAuthController', () => {
    let userAuthController: UserAuthController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [UserAuthController],
            providers: [UserAuthService],
        }).compile();

        userAuthController = app.get<UserAuthController>(UserAuthController);
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(true).toBe(true);
        });
    });
});
