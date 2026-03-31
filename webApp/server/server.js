const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url, true);
	let URLpath = parsedUrl.pathname;

	// Если путь заканчивается на /, считаем, что это index.html
	if (URLpath === '/' || URLpath.endsWith('/')) URLpath = '/index.html';

	// Путь к файлу на диске
	const filePath = path.join(__dirname, '../..'.concat(URLpath));

	// Определяем расширение
	const ext = path.extname(filePath).toLowerCase();
	const contentType = mimeTypes[ext] || 'application/octet-stream';

	fs.readFile(filePath, (err, data) => {
		if (err) {
			// Файл не найден или ошибка доступа
			if (err.code === 'ENOENT') {
				res.statusCode = 404;
				res.setHeader('Content-Type', 'text/plain');
				res.end('Page Not Found\n');
			} else {
				res.statusCode = 500;
				res.setHeader('Content-Type', 'text/plain');
				res.end('Internal Server Error\n');
			}
			return;
		}

		// Успешно прочитали файл
		res.statusCode = 200;
		res.setHeader('Content-Type', contentType);
		res.end(data);
	});
});

server.listen(port, hostname, () => console.log(`Server running at http://${hostname}:${port}/`));