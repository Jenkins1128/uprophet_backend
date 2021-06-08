const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
const signin = require('./controllers/signin');
const signup = require('./controllers/signup');
const home = require('./controllers/home');
const likeButton = require('./controllers/likeButton');
const quoteComments = require('./controllers/quoteComments');
const zlib = require('zlib');

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

app.get('/', (req, res) => {
	home.fetchHome(req, res, db, zlib);
});
app.get('/quote/:quoteId', (req, res) => quoteComments.fetchComments(req, res, db));

app.post('/createQuote', (req, res) => home.createQuote(req, res, db));
app.post('/signin', (req, res) => signin.handleSignin(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/signup', (req, res) => signup.handleSignup(req, res, db, crypto, NONCE_SALT, SITE_KEY));
app.post('/like', (req, res) => likeButton.likeQuote(req, res, db));
app.post('/unlike', (req, res) => likeButton.unlikeQuote(req, res, db));
app.post('/addComment', (req, res) => quoteComments.addComment(req, res, db));

app.listen(3000, () => {
	console.log(`app is running on port 3000`);
});
/*
 / --> res = this is working
*/
