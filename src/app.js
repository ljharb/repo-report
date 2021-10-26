'use strict';

const express = require('express');
const path = require('path');
const open = require('open');

const server = (table) => {
	const app = express();
	const port = 3000;
	app.set('view engine', 'ejs');
	app.get('/', (req, res) => {
		res.render('index', { table });
	});
	app.use('/public', express.static(path.join(__dirname, 'static')));
	app.listen(port);
	open(`http://localhost:${port}`);
};

module.exports = {
	server,
};
