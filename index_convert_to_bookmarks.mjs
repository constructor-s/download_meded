/**
 * Convert the results.json file to a bookmarks.html file
 * Use the library 
 */

import fs from 'fs';
import netscape from 'netscape-bookmarks';

// Take in the filename as the first argument
const filename = process.argv[2];
if (!filename) {
    console.error('Please provide a filename');
    process.exit(1);
}

// The root folder path is:
const root = process.argv[3]; // "MED310";

// Read the file
const data = fs.readFileSync(filename, 'utf8');
const results = JSON.parse(data);

// Create a new JSON object that represent the bookmark structure
// For example:
// {
//   "Second Folder": {
//     "contents": {
//       "Nested Folders!": {
//         "contents": {
//           "YouTube": "http://www.youtube.com",
//           "GitHub": "https://github.com"
//         }
//       }
//     }
//   }
// }
const bookmarks = {};
bookmarks[root] = {
    contents: {}
};

// Results contains the following structure:
// {
//     "https://meded.utoronto.ca/medicine/community/med310y_83_86_98_104_109_113_120": {
//       "contentType": "text/html; charset=UTF-8",
//       "title": "Internal Medicine",
//       "url": "https://meded.utoronto.ca/medicine/community/med310y_83_86_98_104_109_113_120",
//       "path": [],
//     },
//     "https://meded.utoronto.ca/medicine/community/med310y_83_86_98_104_109_113_120:student_assistance": {
//       "contentType": "text/html; charset=UTF-8",
//       "title": "Student Assistance | MD Program",
//       "url": "https://meded.utoronto.ca/medicine/community/med310y_83_86_98_104_109_113_120:student_assistance",
//       "path": [
//         "Student Assistance"
//       ],
//     },
// }

// For each result, add it to the bookmarks object according to the path[:-1]
for (const [key, value] of Object.entries(results)) {
    const path = value.path;
    let current = bookmarks[root];
    for (let i = 0; i < path.length - 1; i++) {
        const folder = path[i];
        if (!current.contents[folder]) {
            current.contents[folder] = { contents: {} };
        } else if (!current.contents[folder].contents) {
            current.contents[folder + ' page'] = current.contents[folder];
            current.contents[folder] = { contents: {} };
        }
        current = current.contents[folder];
    }
    const title = `${value.title || ''} ${path && path.length > 0 ? path[path.length - 1] : ''}`.trim();
    console.log(title);
    current.contents[title] = value.url;
}

console.log(JSON.stringify(bookmarks, null, 2));
const html = netscape(bookmarks);
fs.writeFileSync('bookmarks.html', html);
