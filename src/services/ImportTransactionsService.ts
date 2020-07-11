import { getRepository, In, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import loadCSVOfTransactions from '../providers/LoadCSVOfTransactions';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const { categories, transactions } = await loadCSVOfTransactions(filePath);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = await getRepository(Category);
    const existingCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });
    const titleExistingCategories = existingCategories.map(
      existingCategory => existingCategory.title,
    );
    const categoriesToAdd = categories.filter(
      category => !titleExistingCategories.includes(category),
    );
    const newCategories = categoriesRepository.create(
      categoriesToAdd.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);
    const allCategories = [...newCategories, ...existingCategories];
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionsRepository.save(createdTransactions);
    return createdTransactions;
  }
}
export default ImportTransactionsService;
