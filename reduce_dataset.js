const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Target: ~200k rows to fit in 512MB (roughly 1.4KB per row)
const TARGET_ROWS = 200000;
const INPUT_FILE = 'amazon_products_filtered_64_categories.csv';
const OUTPUT_FILE = 'amazon_products_reduced.csv';

console.log('Creating reduced dataset...');

const csvWriter = createCsvWriter({
  path: OUTPUT_FILE,
  header: [
    {id: 'asin', title: 'asin'},
    {id: 'title', title: 'title'},
    {id: 'imgUrl', title: 'imgUrl'},
    {id: 'productURL', title: 'productURL'},
    {id: 'stars', title: 'stars'},
    {id: 'reviews', title: 'reviews'},
    {id: 'price', title: 'price'},
    {id: 'listPrice', title: 'listPrice'},
    {id: 'isBestSeller', title: 'isBestSeller'},
    {id: 'boughtInLastMonth', title: 'boughtInLastMonth'},
    {id: 'category', title: 'category'}
  ]
});

let rows = [];
let count = 0;

fs.createReadStream(INPUT_FILE)
  .pipe(csv())
  .on('data', (row) => {
    if (count < TARGET_ROWS) {
      rows.push(row);
      count++;
      if (count % 10000 === 0) {
        console.log(`Processed ${count} rows...`);
      }
    }
  })
  .on('end', async () => {
    console.log(`Writing ${rows.length} rows to ${OUTPUT_FILE}...`);
    await csvWriter.writeRecords(rows);
    console.log('Reduced dataset created successfully!');
    console.log(`Original: 376,088 rows`);
    console.log(`Reduced: ${rows.length} rows (${Math.round(rows.length/376088*100)}%)`);
  })
  .on('error', (error) => {
    console.error('Error:', error);
  });
