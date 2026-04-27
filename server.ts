import 'dotenv/config';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import knex from 'knex';
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

const app = express();
const SITE_KEY = process.env.SITE_KEY!;
const NONCE_SALT = process.env.NONCE_SALT!;

const isProd = false;
//DB
const db = knex({
	client: 'mysql2',
	connection:	isProd ? process.env.MYSQL_URL :{
		host: process.env.HOST,
		user: process.env.USER_DEV,
		password: process.env.PASSWORD_DEV,
		database: process.env.DATABASE_DEV
	}
});
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
app.post('/api/favoriters', (req, res) => {
	fetchFavoriters(req, res, db, jwt, accessTokenPayload);
});
app.post('/api/favoriting', (req, res) => {
	fetchFavoriting(req, res, db, jwt, accessTokenPayload);
});
app.post('/api/createQuote', (req, res) => createQuote(req, res, db, jwt, accessTokenPayload));
app.post('/api/signup', (req, res) => handleSignup(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/api/signin', (req, res) => handleSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY, jwt));
app.post('/api/like', (req, res) => likeQuote(req, res, db, jwt, accessTokenPayload));
app.post('/api/unlike', (req, res) => unlikeQuote(req, res, db, jwt, accessTokenPayload));
app.post('/api/addComment', (req, res) => addComment(req, res, db, jwt, accessTokenPayload));
app.post('/api/favorite', (req, res) => favoriteUser(req, res, db, jwt, accessTokenPayload));
app.post('/api/unfavorite', (req, res) => unfavoriteUser(req, res, db, jwt, accessTokenPayload));
app.post('/api/getPhoto', (req, res) => fetchPhoto(req, res, db));
app.post('/api/getComments', (req, res) => fetchComments(req, res, db));
app.post('/api/getQuotePost', (req, res) => getQuotePost(req, res, db, jwt, accessTokenPayload));
app.post('/api/search', (req, res) => getSearchResults(req, res, db, jwt, accessTokenPayload));
app.post('/api/profile', (req, res) => {
	fetchProfileQuotes(req, res, db, jwt, accessTokenPayload);
});
app.post('/api/userInfo', (req, res) => {
	getUserInfo(req, res, db, jwt, accessTokenPayload);
});
app.post('/api/changePasswordSignIn', (req, res) => changePasswordSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/api/changePassword', (req, res) => changePassword(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/api/forgotPassword', (req, res) => forgotPassword(req, res, db, crypto, NONCE_SALT, SITE_KEY));
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
app.put('/api/savebio', (req, res) => saveBio(req, res, db, jwt, accessTokenPayload));
app.put('/api/uploadPic', (req, res) => uploadPhoto(req, res, db, jwt, accessTokenPayload));
//DELETES
app.delete('/api/deleteQuote', (req, res) => deleteQuotePost(req, res, db));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`app is running on port 3001`);
});
