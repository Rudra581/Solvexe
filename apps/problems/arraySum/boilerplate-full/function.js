
##USER_CODE_HERE##

const input = require('fs').readFileSync(0, 'utf-8').trim().split(/\s+/);
const size_arr = parseInt(input.shift());
const arr = input.splice(0, size_arr).map(Number);
const result = Sum(arr);
console.log(result);
    