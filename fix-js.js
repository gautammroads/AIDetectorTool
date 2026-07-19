const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

const files = walk('./js');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Unescape backticks
    content = content.replace(/\\`/g, '`');
    // Unescape ${
    content = content.replace(/\\\${/g, '${');
    // Unescape double backslashes
    content = content.replace(/\\\\/g, '\\');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
});
