import { Router } from 'express';
import ExampleRouter from './Example';

const router = Router();
router.use('/example', ExampleRouter);
export default router;
