const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
const fileUpload = require('express-fileupload');
const signin = require('./controllers/signin');
const signup = require('./controllers/signup');
const home = require('./controllers/home');
const likeButton = require('./controllers/likeButton');
const quoteComments = require('./controllers/quoteComments');
const explore = require('./controllers/explore');
const userphoto = require('./controllers/userphoto');
const { fetchNotifications } = require('./controllers/notifications');
const { fetchProfile } = require('./controllers/profile');
const { fetchFavoriters } = require('./controllers/favoriters');
const { fetchFavoriting } = require('./controllers/favoriting');
const { favoriteUser, unfavoriteUser } = require('./controllers/favoriteButton');

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
app.use(cors());
app.use(fileUpload());

app.get('/', (req, res) => {
	home.fetchHome(req, res, db);
});

app.get('/quote/:quoteId', (req, res) => quoteComments.fetchComments(req, res, db));
app.get('/explore', (req, res) => explore.fetchExplore(res, db));
app.get('/photo', (req, res) => userphoto.getPhoto(req, res, db));
app.get('/notifications', (req, res) => fetchNotifications(req, res, db));

app.get('/:userName', (req, res) => {
	fetchProfile(req, res, db);
});
app.get('/:userName/favoriters', (req, res) => {
	fetchFavoriters(req, res, db);
});
app.get('/:userName/favoriting', (req, res) => {
	fetchFavoriting(req, res, db);
});

app.post('/createQuote', (req, res) => home.createQuote(req, res, db));
app.post('/signin', (req, res) => signin.handleSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/signup', (req, res) => signup.handleSignup(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/like', (req, res) => likeButton.likeQuote(req, res, db));
app.post('/unlike', (req, res) => likeButton.unlikeQuote(req, res, db));
app.post('/addComment', (req, res) => quoteComments.addComment(req, res, db));
app.post('/upload', (req, res) => userphoto.uploadPhoto(req, res, db));
app.post('/favorite', (req, res) => favoriteUser(req, res, db));
app.post('/unfavorite', (req, res) => unfavoriteUser(req, res, db));

app.listen(3000, () => {
	console.log(`app is running on port 3000`);
});
/*
 / --> res = this is working
*/
