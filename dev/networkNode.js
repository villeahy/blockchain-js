import uuid from "uuid";
import express from "express";
import rp from "request-promise";
import bodyParser from "body-parser";
import Blockchain from "./blockchain";

const port = process.env.PORT || 3000;

const nodeAddress = uuid()
  .split("-")
  .join("");

const blockchain = new Blockchain();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/blockchain", (req, res) => {
  res.json(blockchain);
});

app.post("/transaction", (req, res) => {
  const { newTransaction } = req.body;
  const blockIndex = blockchain.addTransactionToPendingTransactions(
    newTransaction
  );
  res.json({
    note: `Transaction will be added to ${blockIndex}`
  });
});

app.post("/transaction/broadcast", (req, res) => {
  const { amount, sender, recipient } = req.body;
  const newTransaction = blockchain.createNewTransaction(
    amount,
    sender,
    recipient
  );
  blockchain.addTransactionToPendingTransactions(newTransaction);

  const requestPromises = [];
  blockchain.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: `${networkNodeUrl}/transaction`,
      method: "POST",
      body: { newTransaction },
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises).then(() => {
    res.json({ note: "Transaction created and broadcasted succesfully" });
  });
});

app.get("/mine", (req, res) => {
  const { index, hash: previousBlockHash } = blockchain.getLastBlock();
  const currentBlockData = {
    transactions: blockchain.pedingTransactions,
    index: index + 1
  };

  const nonce = blockchain.proofOfWork(previousBlockHash, currentBlockData);
  const hash = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
  const newBlock = blockchain.createNewBlock(nonce, previousBlockHash, hash);

  const requestPromises = [];
  blockchain.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/receive-new-block",
      method: "POST",
      body: { newBlock },
      json: true
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
    .then(() => {
      const requestOptions = {
        uri: `${blockchain.currentNodeUrl}/transaction/broadcast`,
        method: "POST",
        body: {
          amount: 12.5,
          sender: "00",
          recipient: nodeAddress
        },
        json: true
      };

      return rp(requestOptions);
    })
    .then(() => {
      res.json({
        note: "New block mined and broadcasted successfully",
        block: newBlock
      });
    });
});

app.post("/receive-new-block", (req, res) => {
  const { newBlock } = req.body;
  const lastBlock = blockchain.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock.index + 1 === newBlock.index;

  if (correctHash && correctIndex) {
    blockchain.chain.push(newBlock);
    blockchain.pedingTransactions = [];
    res.json({ note: "New block received and accepted", newBlock });
  } else {
    res.json({ note: "New block rejected!", newBlock });
  }
});

app.post("/register-and-broadcast-node", (req, res) => {
  const { newNodeUrl } = req.body;
  if (!blockchain.networkNodes.includes(newNodeUrl))
    blockchain.networkNodes.push(newNodeUrl);
  const regNodePromises = [];
  blockchain.networkNodes.forEach(uri => {
    const requestOptions = {
      uri: `${uri}/register-node`,
      method: "POST",
      body: { newNodeUrl },
      json: true
    };
    regNodePromises.push(rp(requestOptions));
  });
  Promise.all(regNodePromises)
    .then(data => {
      const bulkRegisterOptions = {
        url: `${newNodeUrl}/register-nodes-bulk`,
        method: "POST",
        body: {
          allNetworkNodes: [
            ...blockchain.networkNodes,
            blockchain.currentNodeUrl
          ]
        },
        json: true
      };
      return rp(bulkRegisterOptions);
    })
    .then(() => {
      res.json({ note: "New node registered with network succesfully" });
    });
});

app.post("/register-node", (req, res) => {
  const { newNodeUrl } = req.body;
  if (
    ![...blockchain.networkNodes, blockchain.currentNodeUrl].includes(
      newNodeUrl
    )
  )
    blockchain.networkNodes.push(newNodeUrl);

  res.json({ note: "New node registered succesfully!" });
});

app.post("/register-nodes-bulk", (req, res) => {
  const { allNetworkNodes } = req.body;
  const nodes = allNetworkNodes.filter(
    nodeUrl => nodeUrl !== blockchain.currentNodeUrl
  );
  nodes.forEach(networkNodeUrl => {
    if (!blockchain.networkNodes.includes(networkNodeUrl))
      blockchain.networkNodes.push(networkNodeUrl);
  });
  res.json({ note: "Bulk registeration succesful!" });
});

app.listen(port, () => {
  console.log(`Listening on port: ${port}...`);
});
