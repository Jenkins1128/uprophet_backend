import { Router } from 'express';
import { handleSignin, logout } from '../controllers/signin';
import { handleSignup } from '../controllers/signup';
import { forgotPassword } from '../controllers/forgotPassword';
import { changePasswordSignin, changePassword } from '../controllers/changePassword';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { signinSchema, signupSchema, forgotPasswordSchema } from '../validation/schemas';

const router = Router();

router.post('/signup', validate(signupSchema), asyncHandler(handleSignup));
router.post('/signin', validate(signinSchema), asyncHandler(handleSignin));
router.post('/logout', protect, asyncHandler(logout));
router.post('/forgotPassword', validate(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/changePasswordSignIn', validate(signinSchema), asyncHandler(changePasswordSignin));
router.post('/changePassword', validate(signinSchema), asyncHandler(changePassword));

export default router;
