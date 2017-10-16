require('../../../node_modules/skeleton-framework/dist/skeleton.css');
require('../css/style.css');

var Web3 = require('web3');
var Moon = require('moonjs');
var moment = require('moment');
var abi = require('../../../build/contracts/Hammeum.json').abi;

var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");

const HAMMEUM_ADDRESS = '0xbc12074d6ddbe6cb597bcbe47f4c3bede49770e8';
const HAMMEUM = new web3.eth.Contract(abi, HAMMEUM_ADDRESS);

const app = new Moon({
  el: "body",
  data: {
    nextHourTimestamp: moment().add(10, 'minutes').unix(),
    setup: false,
    wallet: {
      disabled: false,
      address: '0x0'
    },
    bank: {
      balance: 0,
      transferTime: 0,
      recurringInDays: 0
    }
  },
  methods: {
    sendSetup: function() {
      const destination = document.getElementById('destination').value;
      const initialAmount = document.getElementById('initialAmount').value;
      const transferTime = document.getElementById('transferTime').value;
      const recurringInDays = document.getElementById('recurringInDays').value;
      HAMMEUM.methods.setup(destination, transferTime, recurringInDays).send({
        value: web3.utils.toWei(initialAmount, 'ether'), 
        from: this.get('wallet').address})
      .then((tx) => {
        console.log(tx);
        getBank();
      });
    },
    sendAmount: function() {
      const amount = document.getElementById('sendAmount').value;
      web3.eth.sendTransaction({
        from: app.get('wallet').address,
        to: HAMMEUM_ADDRESS,
        value: web3.utils.toWei(amount, 'ether')
      }).then((tx) => {
        console.log(tx);
        getBank();
      });
    }
  }
});

web3.eth.getAccounts().then((accounts) => {
  if(accounts.length < 1) {
    app.set('wallet.disabled', true);
    return;
  }
  var account = accounts[0];
  app.set('wallet.address', account);
  getBank();
});

function getBank() {
  console.log(app.get('wallet').address)
  HAMMEUM.methods.banks(app.get('wallet').address).call().then((bank) => {
    console.log(bank);
    app.set('setup', bank.isValue);
    if(bank.isValue) {
      app.set('bank', bank);
      app.set('bank.balance', web3.utils.fromWei(app.get('bank').balance, 'ether'));
    }
  })
}

setInterval(() => {
  getBank();
}, 10000);
