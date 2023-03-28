const express = require('express')
const app = express()
const createPage = require('./crawler');
const cheerio = require('cheerio');
const axios = require('axios');
let retry = 0;
let channel = 'C050GE99TB4';

const request = axios.create({
  headers: {
    Authorization: 'Bearer xoxb-5040166571680-5013601171877-SagyF6QpllS0aI7eIzJVOgO9',
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
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);
    const menu = [];
    let order = 1;
    $('[id*=Menu_]').find('[class*=menuItem___]').each(function(index, element) {
      const selector = $(element);
      if (!!selector.find('[class*=disableOverlay___]').length) {
        console.log(selector.html());
        menu.push({
          name: `${order}. ${capitalize(selector.find('[class*=itemNameTitle___]').text())}`,
          image: selector.find('img').attr('src')
        })

        order++;
      }
    })
    console.log(menu)
    if (!menu.length) throw new Error('Menu is empty');

    let blocks = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ":hamburger: *Mọi người đặt cơm nhé!*"
        }
      },
      {
        "type": "divider"
      }
    ];
    
    menu.forEach(item => {
      blocks.push({
        "type": "context",
        "elements": [
          {
            "type": "image",
            "image_url": item.image,
            "alt_text": item.name
          },
          {
            "type": "mrkdwn",
            "text": item.name
          }
        ]
      })
    })
    
    await sendMessage(blocks);
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