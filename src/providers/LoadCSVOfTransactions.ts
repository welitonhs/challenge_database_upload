/* eslint-disable @typescript-eslint/no-explicit-any */
import csvParse from 'csv-parse';
import fs from 'fs';

interface TransactionsCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface Response {
  categories: string[];
  transactions: TransactionsCSV[];
}

async function LoadCSVOfTransactions(filePath: string): Promise<Response> {
  const readCSVStream = fs.createReadStream(filePath);
  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });
  const parseCSV = readCSVStream.pipe(parseStream);
  const categories: string[] = [];
  const transactions: TransactionsCSV[] = [];
  parseCSV.on('data', line => {
    const [title, type, value, category] = line.map((cell: string) => cell);
    if (!title || !type || !value || !category) return;
    if (!categories.includes(category)) {
      categories.push(category);
    }
    transactions.push({ title, type, value, category });
  });
  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });
  if (await fs.promises.stat(filePath)) {
    await fs.promises.unlink(filePath);
  }
  return { categories, transactions };
}

export default LoadCSVOfTransactions;
