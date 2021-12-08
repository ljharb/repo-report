'use strict';

const axios = require('axios');

const renderBody = (repos, rows) => {
	const tableBody = document.getElementById('table-body');
	repos.forEach((repo, i) => {
		const row = rows[i];
		const tr = document.createElement('tr');

		const left = document.createElement('td');
		left.innerHTML = repo;
		tr.appendChild(left);

		row.forEach((elem) => {
			const td = document.createElement('td');
			td.innerHTML = elem;
			tr.appendChild(td);
		});
		tableBody.appendChild(tr);

	});
};
const renderHead = (head) => {
	const headRow = document.getElementById('table-head');
	head.forEach((element) => {
		const tr = document.createElement('th');
		tr.textContent = element;
		headRow.appendChild(tr);
	});
};
const executeCommand = async (command) => {
	const res = await axios.post('http://localhost:3000/command', {
		command,
	});
	return res.data.output;
};

const handleInput = async (event) => {
	if (event.keyCode === 13) {
		event.preventDefault();
		const response = await executeCommand(input.value);
		console.log(response);
		renderHead(response.metrics);
		renderBody(response.repos, response.rows);
	}
};

let input = document.getElementById('command');
input.addEventListener('keyup', handleInput);
