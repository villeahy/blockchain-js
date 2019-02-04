import uuid from "uuid";
import sha256 from "sha256";

class blockchain {
  constructor() {
    this.chain = [];
    this.pedingTransactions = [];

    this.networkNodes = [];
    this.currentNodeUrl = `http://localhost:${process.env.PORT}`;

    this.createNewBlock(100, "0", "0");
  }

  createNewBlock(nonce, previousBlockHash, hash) {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pedingTransactions,
      nonce,
      hash,
      previousBlockHash
    };

    this.pedingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  createNewTransaction(amount, sender, recipient) {
    const newTransaction = {
      transactionId: uuid()
        .split("-")
        .join(""),
      amount,
      sender,
      recipient
    };

    return newTransaction;
  }

  addTransactionToPendingTransactions(transactionObj) {
    this.pedingTransactions.push(transactionObj);
    return this.getLastBlock()["index"] + 1;
  }

  hashBlock(previousBlockHash, currentBlockData, nonce) {
    const dataAsString = `${previousBlockHash}${JSON.stringify(
      currentBlockData
    )}${nonce}`;
    const hash = sha256(dataAsString);
    return hash;
  }

  proofOfWork(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== "0000") {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
  }
}

module.exports = blockchain;
