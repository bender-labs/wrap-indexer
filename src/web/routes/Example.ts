import { Request, Response, Router } from 'express';

const router = Router();
router.get('/hello',  (_req: Request, res: Response) => {
  return res.json({message: 'Hello'});
});

export default router;
