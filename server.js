require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
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
const SITE_KEY = 'tIVLEabZMrxm!%4ZHJWnXAjxbPt4mYGtyb!@$%&^%VQJsxGjOIdej#OT3EhCpxqC5Bu6KSOJM$$##VJV9jLF5uWiiFXm1G';
const NONCE_SALT = 'fxmAMC5TiY2_)(eh2DfbOOX4*&F73ldggm8KZP35N48t3OVbTaoOpaOlLydef#_+kvusgNgafnuujTPdazfzqpDy';

//DB
const db = require('knex')({
	client: 'mysql2',
	connection: {
		host: process.env.HOST,
		user: process.env.NODE_ENV.trim() === 'development' ? process.env.USER_DEV : process.env.USER_PROD,
		password: process.env.NODE_ENV.trim() === 'development' ? process.env.PASSWORD_DEV : process.env.PASSWORD_PROD,
		database: process.env.NODE_ENV.trim() === 'development' ? process.env.DATABASE_DEV : process.env.DATABASE_PROD
	}
});
//MIDDLEWARE
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload());
app.use(cookieParser());
//POSTS
app.post('/favoriters', (req, res) => {
	fetchFavoriters(req, res, db, jwt, accessTokenPayload);
});
app.post('/favoriting', (req, res) => {
	fetchFavoriting(req, res, db, jwt, accessTokenPayload);
});
app.post('/createQuote', (req, res) => createQuote(req, res, db, jwt, accessTokenPayload));
app.post('/signup', (req, res) => handleSignup(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/like', (req, res) => likeQuote(req, res, db, jwt, accessTokenPayload));
app.post('/unlike', (req, res) => unlikeQuote(req, res, db, jwt, accessTokenPayload));
app.post('/addComment', (req, res) => addComment(req, res, db, jwt, accessTokenPayload));
app.post('/favorite', (req, res) => favoriteUser(req, res, db, jwt, accessTokenPayload));
app.post('/unfavorite', (req, res) => unfavoriteUser(req, res, db, jwt, accessTokenPayload));
app.post('/getPhoto', (req, res) => fetchPhoto(req, res, db));
app.post('/getComments', (req, res) => fetchComments(req, res, db));
app.post('/getQuotePost', (req, res) => getQuotePost(req, res, db, jwt, accessTokenPayload));
app.post('/search', (req, res) => getSearchResults(req, res, db, jwt, accessTokenPayload));
app.post('/profile', (req, res) => {
	fetchProfileQuotes(req, res, db, jwt, accessTokenPayload);
});
app.post('/userInfo', (req, res) => {
	getUserInfo(req, res, db, jwt, accessTokenPayload);
});
app.post('/changePasswordSignIn', (req, res) => changePasswordSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/changePassword', (req, res) => changePassword(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/forgotPassword', (req, res) => forgotPassword(req, res, db, crypto, NONCE_SALT, SITE_KEY, nodemailer));
//GETS
app.get('/', (req, res) => {
	fetchHome(req, res, db, jwt, accessTokenPayload);
});
app.get('/explore', (req, res) => fetchExplore(req, res, db, jwt, accessTokenPayload));
app.get('/notifications', (req, res) => fetchNotifications(req, res, db, jwt, accessTokenPayload));
app.get('/getNotificationCount', (req, res) => getNotificationCount(req, res, db, jwt, accessTokenPayload));
app.get('/currentUser', (req, res) => getUser(req, res, db, jwt, accessTokenPayload));
app.get('/currentUserInfo', (req, res) => getCurrentUserInfo(req, res, db, jwt, accessTokenPayload));
app.get('/logout', (req, res) => logout(req, res, db, jwt, accessTokenPayload));
//PUTS
app.put('/signin', (req, res) => handleSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY, jwt));
app.put('/savebio', (req, res) => saveBio(req, res, db, jwt, accessTokenPayload));
app.put('/uploadPic', (req, res) => uploadPhoto(req, res, db, jwt, accessTokenPayload));
//DELETES
app.delete('/deleteQuote', (req, res) => deleteQuotePost(req, res, db));

app.listen(process.env.PORT, () => {
	console.log(`app is running on port 3001`);
});
