require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const fileUpload = require('express-fileupload');
const { handleSignin, refreshToken, logout } = require('./controllers/signin');
const { handleSignup } = require('./controllers/signup');
const { fetchHome, createQuote } = require('./controllers/home');
const { likeQuote, unlikeQuote } = require('./controllers/likeButton');
const { addComment } = require('./controllers/quoteComments');
const { fetchExplore } = require('./controllers/explore');
const { uploadPhoto } = require('./controllers/userphoto');
const { fetchNotifications } = require('./controllers/notifications');
const { fetchProfile } = require('./controllers/profile');
const { fetchFavoriters } = require('./controllers/favoriters');
const { fetchFavoriting } = require('./controllers/favoriting');
const { favoriteUser, unfavoriteUser } = require('./controllers/favoriteButton');
const { fetchBio, saveBio } = require('./controllers/userbio');
const { verify } = require('./controllers/authenticate');
const { changePasswordSignin, changePassword } = require('./controllers/changePassword');
const { forgotPassword } = require('./controllers/forgotPassword');
const SITE_KEY = 'tIVLEabZMrxm!%4ZHJWnXAjxbPt4mYGtyb!@$%&^%VQJsxGjOIdej#OT3EhCpxqC5Bu6KSOJM$$##VJV9jLF5uWiiFXm1G';
const NONCE_SALT = 'fxmAMC5TiY2_)(eh2DfbOOX4*&F73ldggm8KZP35N48t3OVbTaoOpaOlLydef#_+kvusgNgafnuujTPdazfzqpDy';

const db = require('knex')({
	client: 'mysql2',
	connection: {
		host: 'localhost',
		user: 'root',
		password: 'Ij112897',
		database: 'uprophet'
	}
});

app.use(express.json());
app.use(cors({ credentials: true, origin: true }));
app.use(fileUpload());
app.use(cookieParser());

app.get('/', (req, res) => {
	fetchHome(req, res, db, jwt, refreshToken);
});

app.get('/quote/:quoteId', (req, res) => fetchComments(req, res, db));
app.get('/explore', (req, res) => fetchExplore(res, db));
app.get('/getphoto', (req, res) => fetchPhoto(req, res, db));
app.get('/notifications', (req, res) => fetchNotifications(req, res, db));
app.get('/getbio', (req, res) => fetchBio(req, res, db));

app.get('/logout', (req, res) => logout(req, res, jwt, db));

app.get('/:userName', verify, (req, res) => {
	fetchProfile(req, res, db);
});
app.get('/:userName/favoriters', (req, res) => {
	fetchFavoriters(req, res, db);
});
app.get('/:userName/favoriting', (req, res) => {
	fetchFavoriting(req, res, db);
});

app.post('/createQuote', (req, res) => createQuote(req, res, db));
app.post('/signin', (req, res) => handleSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY, jwt));
app.post('/signup', (req, res) => handleSignup(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/like', (req, res) => likeQuote(req, res, db));
app.post('/unlike', (req, res) => unlikeQuote(req, res, db));
app.post('/addComment', (req, res) => addComment(req, res, db));
app.post('/uploadphoto', (req, res) => uploadPhoto(req, res, db));
app.post('/favorite', (req, res) => favoriteUser(req, res, db));
app.post('/unfavorite', (req, res) => unfavoriteUser(req, res, db));
app.post('/savebio', (req, res) => saveBio(req, res, db));
app.post('/changePasswordSignIn', (req, res) => changePasswordSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/changePassword', (req, res) => changePassword(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/forgotPassword', (req, res) => forgotPassword(req, res, db, crypto, NONCE_SALT, SITE_KEY, nodemailer));

app.listen(process.env.PORT, () => {
	console.log(`app is running on port 3000`);
});
/*
 / --> res = this is working
*/
