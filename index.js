import express from 'express';
import WebTorrent from 'webtorrent';
//import http from 'http';
const PORT = 3000;

// Server init
let client = new WebTorrent();
let app = express();

app.set('view engine', 'ejs');

app.listen(PORT, function (err)
{
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});

let error_message = "";


app.get('/', function (req, res, next)
{
    res.render("index");

});

client.on('error', function (err)
{

    error_message = err.message;

});

app.get('/errors', function (req, res, next)
{

    res.status(200);
    res.json(error_message);

});

app.get('/add/:magnet', function (req, res)
{

    let magnet = atob(req.params.magnet);
    console.log(magnet);

    client.add(magnet, function (torrent)
    {

        let files = [];

        torrent.files.forEach(function (data)
        {

            files.push({
                name: data.name,
                length: data.length
            });

        });
        console.log(files);
        res.status(200)
        res.json(files);

    });

});

console.log(tmpURl("magnet:?xt=urn:btih:21403f993f7ea8448f8e6e378bc17078474587e8&dn=rutor.info_%D0%93%D0%B0%D1%80%D1%80%D0%B8+%D0%9F%D0%BE%D1%82%D1%82%D0%B5%D1%80.+%D0%9F%D0%BE%D0%BB%D0%BD%D0%B0%D1%8F+%D0%BA%D0%BE%D0%BB%D0%BB%D0%B5%D0%BA%D1%86%D0%B8%D1%8F+%2F+Harry+Potter+Complete+8-Film+Collection+%282001-2011%29+UHD+BDRemux+2160p+%7C+4K+%7C+HDR+%7C+D&tr=udp://opentor.net:6969&tr=http://retracker.local/announce", "Harry.Potter.And.The.Chamber.of.Secrets.2002.2160p.BluRay.Remux.Rus.Ukr.Eng.mkv"));

app.get('/stream/:magnet/:file_name', async (req, res, next) =>
{
    let file = {};

    let magnet = atob(req.params.magnet);

    let chosenFileName = atob(req.params.file_name);

    let tor = await client.get(magnet);

    for (let i = 0; i < tor.files.length; i++)
    {
        console.log(tor.files[i].name);
        if (tor.files[i].name == chosenFileName)
        {
            file = tor.files[i];
            break;
        }
    }

    let range = req.headers.range;

    if (!range)
    {
        let err = new Error("Wrong range");
        err.status = 416;

        return next(err);
    }

    let positions = range.replace(/bytes=/, "").split("-");


    const start = parseInt(positions[0], 10);

    let file_size = file.length;

    let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;

    let chunksize = (end - start) + 1;

    let head = {
        "Content-Range": "bytes " + start + "-" + end + "/" + file_size,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4"
    }

    res.writeHead(206, head);

    let stream_position = {
        start: start,
        end: end
    }

    let stream = file.createReadStream(stream_position);

    stream.pipe(res);

    stream.on("error", function (err)
    {

        return next(err);

    });

});


function tmpURl(magnet, file_name)
{
    const MAGNET = btoa(magnet);
    const FN = btoa(file_name);

    return "http://localhost:3000/stream/" + MAGNET + "/" + FN;

}
