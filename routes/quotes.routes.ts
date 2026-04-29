import { Router } from 'express';
import { fetchHome, createQuote } from '../controllers/home';
import { likeQuote, unlikeQuote } from '../controllers/likeButton';
import { addComment, fetchComments } from '../controllers/quoteComments';
import { getQuotePost, deleteQuotePost } from '../controllers/quotePost';
import { fetchExplore } from '../controllers/explore';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { createQuoteSchema, quoteIdSchema, addCommentSchema, quoteIdParamSchema } from '../validation/schemas';

const router = Router();

// All quote routes require authentication
router.use(protect);

router.get('/', asyncHandler(fetchHome));
router.get('/explore', asyncHandler(fetchExplore));
router.post('/createQuote', validate(createQuoteSchema), asyncHandler(createQuote));
router.post('/like', validate(quoteIdSchema), asyncHandler(likeQuote));
router.post('/unlike', validate(quoteIdSchema), asyncHandler(unlikeQuote));
router.post('/addComment', validate(addCommentSchema), asyncHandler(addComment));
router.get('/quotes/:quoteId/comments', validate(quoteIdParamSchema, 'params'), asyncHandler(fetchComments));
router.get('/quotes/:quoteId', validate(quoteIdParamSchema, 'params'), asyncHandler(getQuotePost));
router.delete('/deleteQuote', validate(quoteIdSchema), asyncHandler(deleteQuotePost));

export default router;
