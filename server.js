require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const { getUser } = require('./controllers/user');
const { handleSignin, accessTokenPayload, logout } = require('./controllers/signin');
const { handleSignup } = require('./controllers/signup');
const { fetchHome, createQuote } = require('./controllers/home');
const { likeQuote, unlikeQuote } = require('./controllers/likeButton');
const { addComment, fetchComments } = require('./controllers/quoteComments');
const { fetchExplore } = require('./controllers/explore');
const { uploadPhoto, fetchPhoto } = require('./controllers/userphoto');
const { fetchNotifications } = require('./controllers/notifications');
const { fetchProfileQuotes, getUserInfo, getCurrentUserInfo } = require('./controllers/profile');
const { fetchFavoriters } = require('./controllers/favoriters');
const { fetchFavoriting } = require('./controllers/favoriting');
const { favoriteUser, unfavoriteUser } = require('./controllers/favoriteButton');
const { saveBio } = require('./controllers/userbio');
const { changePasswordSignin, changePassword } = require('./controllers/changePassword');
const { forgotPassword } = require('./controllers/forgotPassword');
const { getNotificationCount } = require('./controllers/notificationCount');
const { getQuotePost, deleteQuotePost } = require('./controllers/quotePost');
const { getSearchResults } = require('./controllers/search');
const SITE_KEY = process.env.SITE_KEY;
const NONCE_SALT = process.env.NONCE_SALT;

const isProd = true;
//DB
const db = require('knex')({
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
	origin: ['https://uprophet.com', 'https://www.uprophet.com', 'http://localhost:3001'],
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
app.get('/api/logout', (req, res) => logout(req, res, db, jwt, accessTokenPayload));
//PUTS
app.put('/api/signin', (req, res) => handleSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY, jwt));
app.put('/api/savebio', (req, res) => saveBio(req, res, db, jwt, accessTokenPayload));
app.put('/api/uploadPic', (req, res) => uploadPhoto(req, res, db, jwt, accessTokenPayload));
//DELETES
app.delete('/api/deleteQuote', (req, res) => deleteQuotePost(req, res, db));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`app is running on port 3001`);
});
