'use strict';

const express = require('express');
const { executeCommand } = require('./controllers');
const path = require('path');
// const open = require('open');

const server = (table) => {
	const app = express();
	const port = 3000;
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.set('view engine', 'ejs');
	app.get('/', (req, res) => {
		res.render('index', { table });
	});
	app.use('/public', express.static(path.join(__dirname, 'static')));
	app.post('/command', executeCommand);
	app.listen(port, () => {
		console.log(`app is listening on port ${port}`);
	});
};

module.exports = {
	server,
};
