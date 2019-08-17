const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios').default;

// replace the value below with the Telegram token you receive from @BotFather
const token = '';


function toPercent(data) {
    return Math.round(parseFloat(data) * 10000) / 100;
}

function toPercent2(data) {
    if(data == void 0) return "-";
    return Math.round(parseFloat(data) * 100) / 100;
}

async function compound() {
    const compoundResult = await axios.get("https://api.compound.finance/api/v2/ctoken");
    let resString = "Compound Finance\n==================\n";
    for (const token of compoundResult.data.cToken) {
        let str = token.underlying_name + '\n';
        str += "borrow rate: " + toPercent(token.borrow_rate.value) + "%\n"
        str += "supply rate: " + toPercent(token.supply_rate.value) + "%\n\n"
        resString += str;
    }

    return resString;
}

async function defiPulse(token) {
    const result = await axios.get("https://public.defipulse.com/api/GetRates?token=" + token + "&amount=10000");
    let resString = token + "\n=====================\n";
  
    const mkr = result.data.rates["Maker"];
    if(mkr != void 0) {
        resString += "MakerDAO\n" + "borrow rate: " + toPercent2(mkr.borrow.rate) + "%\n\n";
    }
    const compound = result.data.rates["Compound"];
    if(compound != void 0) {
        resString += "Compound\n" + "borrow rate: " + toPercent2(compound.borrow.rate) + "%\n" + "supply rate: " + toPercent2(compound.lend.rate) + "%\n\n";
    }
    const nuo = result.data.rates["Nuo Network"];
    if(nuo != void 0) {
        resString += "Nuo Network\n" + "borrow rate: " + toPercent2(nuo.borrow.rate) + "%\n" + "supply rate: " + toPercent2(nuo.lend.rate) + "%\n\n";
    }
    const dydx = result.data.rates["dYdX"];
    if(dydx != void 0) {
        resString += "dYdX\n" + "borrow rate: " + toPercent2(dydx.borrow.rate) + "%\n" + "supply rate: " + toPercent2(dydx.lend.rate) + "%\n\n";
    }
    const b0x = result.data.rates["Fulcrum"];
    if(b0x != void 0) {
        resString += "Fulcrum(b0x)\n" + "borrow rate: " + toPercent2(b0x.borrow.rate) + "%\n" + "supply rate: " + toPercent2(b0x.lend.rate) + "%\n";
    }

    console.log(new Date(), resString);
    return resString;
}

async function bitfinex() {
    const usdRes = await axios.get("https://api.bitfinex.com/v1/lends/usd");
    const usdtRes = await axios.get("https://api.bitfinex.com/v1/lends/ust");

    let usdSum = 0;
    let usdtSum = 0;

    for(let i = 0; i < 50; i++) {
        usdSum += usdRes.data[i].rate * 1;
        usdtSum += usdtRes.data[i].rate * 1;
    }
    const usdAvg = Math.round(usdSum * 2) / 100;
    const usdtAvg = Math.round(usdtSum * 2) / 100;

    let resString = "Bitfinex\n=====================\n";
    resString += "USD lend rate: " + usdAvg + "%\n";
    resString += "USDT lend rate: " + usdtAvg + "%\n\n";
    resString += "average lend data of recent 50"

    return resString;
}

async function poloniex() {
    const usdtRes = await axios.get("https://poloniex.com/public?command=returnLoanOrders&currency=USDT");
    const usdcRes = await axios.get("https://poloniex.com/public?command=returnLoanOrders&currency=USDC");

    const usdtOffer = usdtRes.data.offers;
    const usdcOffer = usdcRes.data.offers;

    let usdtSum = 0;
    let usdtRateSum = 0;
    let i = 0;
    while(usdtSum < 10000) {
        usdtSum += usdtOffer[i].amount * 1;
        usdtRateSum += (usdtOffer[i].rate * 365) * (usdtOffer[i].amount * 1);
        i++;
    }

    let usdcSum = 0;
    let usdcRateSum = 0;
    i = 0;
    while(usdcSum < 20000) {
        usdcSum += usdcOffer[i].amount * 1;
        usdcRateSum += (usdcOffer[i].rate * 365) * (usdcOffer[i].amount * 1);
        i++;
    }
    
    const usdtAvg = Math.round(usdtRateSum / usdtSum * 10000) / 100;
    const usdcAvg = Math.round(usdcRateSum / usdcSum * 10000) / 100;

    let resString = "Poloniex\n=====================\n";
    resString += "USDT lend rate: " + usdtAvg + "%\n";
    resString += "USDC lend rate: " + usdcAvg + "%\n\n";
    resString += "avg rate to lend usdt $10000, usdc $20000"

    return resString;
}

async function main() {
    const bot = new TelegramBot(token);

    const daiRes = await defiPulse("DAI");
    bot.sendMessage("@defi_lend_rate", daiRes);
    const usdcRes = await defiPulse("USDC");
    bot.sendMessage("@defi_lend_rate", usdcRes);
    const poloniexRes = await poloniex();
    bot.sendMessage("@defi_lend_rate", poloniexRes);
    const bitfinexRes = await bitfinex();
    bot.sendMessage("@defi_lend_rate", bitfinexRes);
    return;
}

main();
