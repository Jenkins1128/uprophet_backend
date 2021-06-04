const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const cors = require('cors');
var crypto = require('crypto');
const SqlString = require('sqlstring');
const signin = require('./controllers/signin');

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
	res.send('it is working!');
});

app.post('/signin', (req, res) => signin.handleSignin(req, res, db, bcrypt, crypto, NONCE_SALT, SITE_KEY, SqlString));

app.listen(3000, () => {
	console.log(`app is running on port 3000`);
});
/*
 / --> res = this is working
*/
