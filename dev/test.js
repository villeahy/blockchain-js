const Blockchain = require("./blockchain");

const blockchain = new Blockchain();

console.log(blockchain.proofOfWork(previousBlockHash, currentBlockData));
/*


blockchain.createNewBlock(213123124, "3443432", "123124fef");
blockchain.createNewTransaction(100, "ALEXt34434", "JENNtdrt3443");
blockchain.createNewBlock(139993124, "34434sadasdsd2", "1dsada24fef");
blockchain.createNewTransaction(50, "ALEXt34434", "JENNtdrt3443");
blockchain.createNewTransaction(300, "ALEXt34434", "JENNtdrt3443");
blockchain.createNewTransaction(2000, "ALEXt34434", "JENNtdrt3443");
blockchain.createNewBlock(97879090, "3czxc3432", "1231mnbmef");
*/
// console.log(blockchain);
