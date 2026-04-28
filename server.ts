import 'dotenv/config';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { db } from './db';
import { getUser } from './controllers/user';
import { handleSignin, accessTokenPayload, logout } from './controllers/signin';
import { handleSignup } from './controllers/signup';
import { fetchHome, createQuote } from './controllers/home';
import { likeQuote, unlikeQuote } from './controllers/likeButton';
import { addComment, fetchComments } from './controllers/quoteComments';
import { fetchExplore } from './controllers/explore';
import { uploadPhoto, fetchPhoto } from './controllers/userphoto';
import { fetchNotifications } from './controllers/notifications';
import { fetchProfileQuotes, getUserInfo, getCurrentUserInfo } from './controllers/profile';
import { fetchFavoriters } from './controllers/favoriters';
import { fetchFavoriting } from './controllers/favoriting';
import { favoriteUser, unfavoriteUser } from './controllers/favoriteButton';
import { saveBio } from './controllers/userbio';
import { changePasswordSignin, changePassword } from './controllers/changePassword';
import { forgotPassword } from './controllers/forgotPassword';
import { getNotificationCount } from './controllers/notificationCount';
import { getQuotePost, deleteQuotePost } from './controllers/quotePost';
import { getSearchResults } from './controllers/search';
import { validate } from './middleware/validate';
import {
	usernameSchema,
	signinSchema,
	signupSchema,
	createQuoteSchema,
	quoteIdSchema,
	addCommentSchema,
	toUserSchema,
	searchSchema,
	bioSchema,
	uploadPhotoSchema,
	forgotPasswordSchema
} from './validation/schemas';

const app = express();
const SITE_KEY = process.env.SITE_KEY!;
const NONCE_SALT = process.env.NONCE_SALT!;

//MIDDLEWARE
app.use(cors({
	credentials: true,
	origin: ['https://uprophet.com', 'https://www.uprophet.com', 'http://localhost:3000'],
  	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload());
app.use(cookieParser());
//POSTS
app.post('/api/favoriters', validate(usernameSchema), (req, res) => {
	fetchFavoriters(req, res, db, jwt, accessTokenPayload);
});
app.post('/api/favoriting', validate(usernameSchema), (req, res) => {
	fetchFavoriting(req, res, db, jwt, accessTokenPayload);
});
app.post('/api/createQuote', validate(createQuoteSchema), (req, res) => createQuote(req, res, db, jwt, accessTokenPayload));
app.post('/api/signup', validate(signupSchema), (req, res) => handleSignup(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/api/signin', validate(signinSchema), (req, res) => handleSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY, jwt));
app.post('/api/like', validate(quoteIdSchema), (req, res) => likeQuote(req, res, db, jwt, accessTokenPayload));
app.post('/api/unlike', validate(quoteIdSchema), (req, res) => unlikeQuote(req, res, db, jwt, accessTokenPayload));
app.post('/api/addComment', validate(addCommentSchema), (req, res) => addComment(req, res, db, jwt, accessTokenPayload));
app.post('/api/favorite', validate(toUserSchema), (req, res) => favoriteUser(req, res, db, jwt, accessTokenPayload));
app.post('/api/unfavorite', validate(toUserSchema), (req, res) => unfavoriteUser(req, res, db, jwt, accessTokenPayload));
app.post('/api/getPhoto', validate(usernameSchema), (req, res) => fetchPhoto(req, res, db));
app.post('/api/getComments', validate(quoteIdSchema), (req, res) => fetchComments(req, res, db));
app.post('/api/getQuotePost', validate(quoteIdSchema), (req, res) => getQuotePost(req, res, db, jwt, accessTokenPayload));
app.post('/api/search', validate(searchSchema), (req, res) => getSearchResults(req, res, db, jwt, accessTokenPayload));
app.post('/api/profile', validate(usernameSchema), (req, res) => {
	fetchProfileQuotes(req, res, db, jwt, accessTokenPayload);
});
app.post('/api/userInfo', validate(usernameSchema), (req, res) => {
	getUserInfo(req, res, db, jwt, accessTokenPayload);
});
app.post('/api/changePasswordSignIn', validate(signinSchema), (req, res) => changePasswordSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/api/changePassword', validate(signinSchema), (req, res) => changePassword(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/api/forgotPassword', validate(forgotPasswordSchema), (req, res) => forgotPassword(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/api/logout', (req, res) => logout(req, res, db, jwt, accessTokenPayload));
//GETS
app.get('/api/', (req, res) => {
	fetchHome(req, res, db, jwt, accessTokenPayload);
});
app.get('/api/test', (req, res) => {
	res.json({ test: 'its working!' });
});
app.get('/api/explore', (req, res) => fetchExplore(req, res, db, jwt, accessTokenPayload));
app.get('/api/notifications', (req, res) => fetchNotifications(req, res, db, jwt, accessTokenPayload));
app.get('/api/getNotificationCount', (req, res) => getNotificationCount(req, res, db, jwt, accessTokenPayload));
app.get('/api/currentUser', (req, res) => getUser(req, res, db, jwt, accessTokenPayload));
app.get('/api/currentUserInfo', (req, res) => getCurrentUserInfo(req, res, db, jwt, accessTokenPayload));
//PUTS
app.put('/api/savebio', validate(bioSchema), (req, res) => saveBio(req, res, db, jwt, accessTokenPayload));
app.put('/api/uploadPic', validate(uploadPhotoSchema), (req, res) => uploadPhoto(req, res, db, jwt, accessTokenPayload));
//DELETES
app.delete('/api/deleteQuote', validate(quoteIdSchema), (req, res) => deleteQuotePost(req, res, db));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`app is running on port ${PORT}`);
});
