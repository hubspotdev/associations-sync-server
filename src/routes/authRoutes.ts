import express, { Request, Response } from 'express';
import { authUrl, redeemCode } from '../auth';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.redirect(authUrl);
});

router.get('/oauth-callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  if (code) {
    try {
      const authInfo = await redeemCode(code.toString());
      if (authInfo) {
        const { accessToken } = authInfo;
        console.log('Access token ==', accessToken);
        res.send('Success!');
      }
    } catch (error:unknown) {
      console.log('An error occurred while redeeming the code', error);
    }
  }
});

export default router;
