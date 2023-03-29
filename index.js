const express = require('express')
const app = express()
const createPage = require('./crawler');
const axios = require('axios');
let retry = 0;
let channel = 'C050GE99TB4';
let menuReviews = require('./menuReviews');

const request = axios.create({
  headers: {
    Authorization: 'Bearer xoxb-5040166571680-5015739561079-N4e6giZGqbpNCakSMh6Ibmpu',
    'Content-Type': 'application/json'
  }
})

const capitalize = (str) => {
  var splitStr = str.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
  }
  return splitStr.join(' '); 
}

app.get('/com-trua', async (req, res) => {
  const result = await getMenu();
  res.send({
    success: result
  });
})

const getMenu = async () => {
  try {
    const page = await createPage('https://food.grab.com/vn/en/restaurant/c%C6%A1m-thu-ph%C6%B0%C6%A1ng-c%C6%A1m-v%C4%83n-ph%C3%B2ng-delivery/5-C2WTEVLBNFCUET');
    const json = JSON.parse(await (await page.waitForSelector('#__NEXT_DATA__')).evaluate(el => el.textContent));
    const items = json.props.initialReduxState.pageRestaurantDetail.entities['5-C2WTEVLBNFCUET'].menu.categories[1].items;

    const menu = [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":hamburger: *Mọi người đặt cơm nhé!*"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "divider"
    }];

    items.forEach(item => {
      if (!item.available) return false;
      const name = capitalize(item.name).replace(/Cơm/, '');
      let menuReview = menuReviews[item.ID] || {};
      let review = menuReview.review ? `\n_${menuReview.review}_` : '';
      let star = '';
      if (menuReview.star) {
        star = new Array(menuReview.star).fill(':star:').join(' ')
        star = `\n${star}`
      }
      menu.push({
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*+1 ${name}*\n${star}${review}`
        },
        "accessory": {
            "type": "image",
            "image_url": item.imgHref,
            "alt_text": name
        },
      })

      menu.push({
        "type": "divider"
      })
    })

    await sendMessage(menu);
    return true;

  } catch (e) {
    console.log(e);
    if (retry < 5) {
      retry++;
      return getMenu();
    }
    retry = 0;
    return false;
  }
}

const sendMessage = async blocks => {
  try {
    const result = await request.post('https://slack.com/api/chat.postMessage', {
      channel,
      blocks
    });
    if (result && result.data && result.data.ok === false) {
      console.log(result);
    }
  } catch (e) {
    console.log(e);
  }
}

app.listen(5555, () => {
  console.log(`Example app listening on port ${5555}`)
})