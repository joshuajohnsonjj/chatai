import { Controller, Get, Logger, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { GoogleAuthService } from './googleAuth.service';
import { ConfigService } from '@nestjs/config';
import { LoggerContext } from 'src/constants';

@Controller('v1/auth/google')
export class GoogleAuthController {
    constructor(
        private readonly authService: GoogleAuthService,
        private readonly logger: Logger,
        private readonly configService: ConfigService,
    ) {}

    @Get()
    @UseGuards(AuthGuard('google'))
    async googleAuth() {}

    @Get('callback')
    @UseGuards(AuthGuard('google'))
    googleAuthRedirect(@Req() req, @Res() res: Response) {
      this.logger.log(`Handling callback for google user ${req.user.id}`, LoggerContext.GOOGLE_AUTH);
      
      // set cookie & redirect back to app
      res.cookie('jwt', req.user.accessToken);
      res.redirect(this.configService.get<string>('CLIENT_OAUTH_REDIRECT_URL')!);
    }

    @Get('status')
    status(@Req() req: Request) {
      if (req.user) {
          return req.user;
      } else {
          return 'Not authenticated';
      }
    }

    @Get('logout')
    logout(@Req() req, @Res() res: Response) {
        req.logout();
        res.clearCookie('jwt');
        res.redirect(this.configService.get<string>('CLIENT_OAUTH_REDIRECT_URL')!);
    }
}
