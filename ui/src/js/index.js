require('../../../node_modules/skeleton-framework/dist/skeleton.css');
require('../css/style.css');

var Web3 = require('web3');
var Moon = require('moonjs');
var moment = require('moment');
var abi = require('../../../build/contracts/Hammeum.json').abi;

var web3;
var HAMMEUM;

const HAMMEUM_ADDRESS = '0x12d1cb090b747cfeeb207569087c24694ec2cfb8';

const DATE_FORMAT = 'DD/MM/YYYY';
const TIME_FORMAT = 'HH:mm';
const DATE_TIME_FORMAT = DATE_FORMAT + ' ' + TIME_FORMAT;

const app = new Moon({
  el: "body",
  data: {
    contractAddress: HAMMEUM_ADDRESS,
    nextHourDate: moment().add(10, 'minutes').format(DATE_FORMAT),
    nextHourTime: moment().add(10, 'minutes').format(TIME_FORMAT),
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
      const transferDate = document.getElementById('transferDate').value;
      const transferTime = document.getElementById('transferTime').value;
      const transferDateTime = moment(transferDate + ' ' + transferTime, DATE_TIME_FORMAT)
      if(!transferDateTime.isValid()) {
        return; 
      }
      const transferTimestamp = transferDateTime.unix();
      const recurringInDays = document.getElementById('recurringInDays').value;
      HAMMEUM.methods.setup(destination, transferTimestamp, recurringInDays).send({
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
        value: web3.utils.toWei(amount, 'ether'),
        gas: 100000
      }).then((tx) => {
        console.log(tx);
        getBank();
      });
    }
  }
});

function getBank() {
  HAMMEUM.methods.banks(app.get('wallet').address).call().then((bank) => {
    console.log(bank);
    app.set('setup', bank.isValue);
    if(bank.isValue) {
      app.set('bank', bank);
      app.set('bank.balance', web3.utils.fromWei(bank.balance, 'ether'));
      app.set('bank.transferDateTime', moment(bank.transferTime, 'X').format(DATE_TIME_FORMAT));
    }
  })
}

function startSyncer() {
  setInterval(() => {
    getBank();
  }, 10000);
}


window.addEventListener('load', function() {
  web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
  HAMMEUM = new web3.eth.Contract(abi, HAMMEUM_ADDRESS);
  
  web3.eth.getAccounts().then((accounts) => {
    if(accounts.length < 1) {
      app.set('wallet.disabled', true);
      return;
    }
    var account = accounts[0];
    app.set('wallet.address', account);
    getBank();
  });

  startSyncer();
});
