const unirest = require('unirest');                                   
const cheerio = require('cheerio'); 
const fs = require('fs'); 
const path = require('path'); 
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const dir = path.join(__dirname, 'blog');
const csvFilePath = __dirname + '/blog/blog.csv';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
const csvHeader = ['Title', 'Date', 'Image URL', 'Likes'];
const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: csvHeader.map(header => ({ id: header, title: header })),
    append: true
});
let arr = [];
async function fetchAndAdd (url) {
    return new Promise((resolve, reject) => {
        unirest.get(url).headers({'Accept': 'application/json', 'Content-Type': 'application/json'}).then(function(res) {
            if (res.error) {
                console.log(res.error);
                reject();
            }
            const $ = cheerio.load(res.body);
            const blogImageURL = $('div.wrap');
            blogImageURL.each((i, div) => {
                let blogData = {
                    'Title': '',
                    'Date': '',
                    'Image URL': '',
                    'Likes': ''
                };
                blogData['Image URL'] = $(div).children(".img").children('a').attr('data-bg');
                const blogContent = $(div).children(".content");
                blogContent.each((i, child) => {
                    blogData['Title'] = $(child).children('h6').text();
                    blogData['Likes'] = ($(child).children('a').text()).split(' ')[2];
                    const blogChildern = $(child).children('.blog-detail').children('.bd-item');
                    blogChildern.each((ind, detail) => {
                        if(ind === 0){
                            blogData['Date'] = $(detail).children('span').html();
                        }
                    })
                })
                console.log(blogData);
                arr.push(blogData);
                try {
                    csvWriter.writeRecords(arr)
                    .then(() => {
                        resolve();
                        return;
                    })
                    .catch((error) => {
                        console.error(error); 
                        reject();
                        return;
                    })
                    arr = [];
                } catch (error) {
                    console.log(error);
                    arr = [];
                    reject();
                    return;
                }
            });
        });
    })
}

async function fetchData() {
    for (let i = 1; i < 46;) {
        let url = `https://rategain.com/blog/page/${i}`;  
        await fetchAndAdd(url)
        .then(i++)
        .catch((err) => {
            i++;
        });
    }
}

fetchData();