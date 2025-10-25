import http from 'http';

const SERVER_HOST = process.env.SERVER_HOST;
const SERVER_PORT = process.env.SERVER_PORT;

async function main() {
    try{
        const server = http.createServer();
        server.on('request', (req, res) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            // res.end('Hello World');
            res.end(JSON.stringify({SERVER_HOST, SERVER_PORT}));
        });
        server.listen(SERVER_PORT, SERVER_HOST, () => {
            // console.log(`Server is running on http://${SERVER_HOST}:${SERVER_PORT}`);
        });
    } catch (error) {
        console.error('Something went wrong', error);
    }
}

main()
    .then(() => console.log(`Server is running on ` + SERVER_HOST + ':' + SERVER_PORT))
    .catch(err => console.error('Something went wrong', err));