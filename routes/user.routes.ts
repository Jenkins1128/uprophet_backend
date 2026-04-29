import { Router } from 'express';
import { getUser } from '../controllers/user';
import { fetchProfileQuotes, getUserInfo, getCurrentUserInfo } from '../controllers/profile';
import { saveBio } from '../controllers/userbio';
import { uploadPhoto, fetchPhoto } from '../controllers/userphoto';
import { fetchNotifications } from '../controllers/notifications';
import { getNotificationCount } from '../controllers/notificationCount';
import { fetchFavoriters } from '../controllers/favoriters';
import { fetchFavoriting } from '../controllers/favoriting';
import { favoriteUser, unfavoriteUser } from '../controllers/favoriteButton';
import { getSearchResults } from '../controllers/search';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { usernameSchema, bioSchema, uploadPhotoSchema, toUserSchema, searchSchema } from '../validation/schemas';

const router = Router();

// All user routes require authentication
router.use(protect);

router.get('/currentUser', asyncHandler(getUser));
router.get('/currentUserInfo', asyncHandler(getCurrentUserInfo));
router.post('/profile', validate(usernameSchema), asyncHandler(fetchProfileQuotes));
router.post('/userInfo', validate(usernameSchema), asyncHandler(getUserInfo));
router.put('/savebio', validate(bioSchema), asyncHandler(saveBio));
router.put('/uploadPic', validate(uploadPhotoSchema), asyncHandler(uploadPhoto));
router.post('/getPhoto', validate(usernameSchema), asyncHandler(fetchPhoto));
router.get('/notifications', asyncHandler(fetchNotifications));
router.get('/getNotificationCount', asyncHandler(getNotificationCount));
router.post('/favoriters', validate(usernameSchema), asyncHandler(fetchFavoriters));
router.post('/favoriting', validate(usernameSchema), asyncHandler(fetchFavoriting));
router.post('/favorite', validate(toUserSchema), asyncHandler(favoriteUser));
router.post('/unfavorite', validate(toUserSchema), asyncHandler(unfavoriteUser));
router.post('/search', validate(searchSchema), asyncHandler(getSearchResults));

export default router;
