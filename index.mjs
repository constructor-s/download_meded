import fs from 'fs';
// import path from 'path';
import * as cheerio from 'cheerio';
// import fetch from 'node-fetch';

// Usage example
const url = 'https://meded.utoronto.ca/medicine/community/med310y_83_86_98_104_109_113_120';
const cookie = process.env.MEDED_COOKIE;

async function downloadWebsite(url, cookie) {
    // Create a dictionary from urls to data to store results
    const results = {};

    // Create a FIFO queue of urls to download
    const queue = [{
        currUrl: url, linkNames: []
    }];

    while (queue.length > 0) {
        const { currUrl, linkNames } = queue.shift();
        if (results[currUrl]) {
            // console.log(`Skipping ${url} at ${linkNames}: Already downloaded`);
            continue;
        }

        // If the URL starts with https://meded.utoronto.ca/medicine/file-event.php
        // Add it directly to the results
        // if (currUrl.startsWith('https://meded.utoronto.ca/medicine/file-event.php') || 
        //     currUrl.startsWith('https://meded.utoronto.ca/medicine/api')) {
        if (!currUrl.startsWith(url)) {
            results[currUrl] = {
                url: currUrl,
                path: linkNames
            };
        } else {
            console.log(`${linkNames} at ${currUrl}`);
            const response = await fetch(currUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Referer': 'https://meded.utoronto.ca/medicine/community/med310y_83_86_98_104_109_113_120',
                    'Connection': 'keep-alive',
                    'Cookie': cookie,
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin',
                    'Priority': 'u=0, i'
                }
            });
            const contentType = response.headers.get('content-type');
            
            // If content type is HTML, parse the title and get the content
            if (contentType && contentType.includes('text/html')) {
                const text = await response.text();
                // Get the title of the page
                const title = text.match(/<title>(.*)<\/title>/)[1];

                results[currUrl] = {
                    contentType: contentType,
                    title: title,
                    url: currUrl,
                    path: linkNames,
                    text: text
                };

                // Extract all the links from the HTML
                const links = extractLinks(text);

                for (const link of links) {
                    const text = link.text.trim();
                    const newLinkNames = [...linkNames, text];
                    // console.log(linkNames);
                    // console.log(newLinkNames);
                    if (newLinkNames.length < 10) {
                        queue.push({ currUrl: link.href, linkNames: newLinkNames });
                    }
                }
            } else {
                results[currUrl] = {
                    contentType: response.headers.get('content-type'),
                    url: currUrl,
                };
            }
        }
    }

    return results;
}

function extractLinks(data) {
    // Implement your logic to extract links from the HTML here
    // You can use libraries like cheerio or regex to parse the HTML and extract links
    // Return an array of URLs

    // Get all a href links from the page that starts with:
    // https://meded.utoronto.ca/medicine/community/med310y_83_86_98_104_109_113_120
    // /medicine/community/med310y_83_86_98_104_109_113_120
    
    const LINK_STARTS = [
        url, // The URL itself
        // Remove the domain name part from the URL
        new URL(url).pathname,
        // '/medicine/community/med310y_83_86_98_104_109_113_120',
        'https://meded.utoronto.ca/medicine/events',
        '/medicine/events',
        'https://meded.utoronto.ca/medicine/file-event.php',
        '/medicine/file-event.php',
        'https://meded.utoronto.ca/medicine/api',
        '/medicine/api',
    ]

    const $ = cheerio.load(data);
    const ret = $('a')
    .filter((i, el) => {
        const href = $(el).attr('href');
        if (href) { // && LINK_STARTS.some(linkStart => href.startsWith(linkStart))) {
            return true;
        }
    })
    .map((i, el) => {
        const href = $(el).attr('href');
        return {
            text: $(el).text(),
            href: href.startsWith('/') ? `https://meded.utoronto.ca${href}` : href
        }
    });
    // console.log(ret);
    return ret;
}

const results = await downloadWebsite(url, cookie);
// Save to disk
fs.writeFileSync('results.json', JSON.stringify(results, null, 2));




    // const urlParts = new URL(url).pathname.substring(1).split('/').map(part => encodeURIComponent(part));
    // const filePath = path.join(".", ...urlParts);
    // if (fs.existsSync(filePath)) {
    //     console.log(`File ${filePath} already exists`);
    //     return;
    // }
    // fs.mkdirSync(path.dirname(filePath), { recursive: true });
    // console.log(urlParts);