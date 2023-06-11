import TelegramBot from "node-telegram-bot-api";
import { PrismaClient } from "@prisma/client";
import { redis } from "./redis_db.js";
let prisma = new PrismaClient();

const token = "6075176198:AAFY27WzY2wSqJALsIlzEjHgbQtQ2J1epuU";
const bot = new TelegramBot(token, {
  polling: true,
});

await redis.create();
redis.client.on('connect', function(){
  console.log("Connected")
})


const instructions = `Как пользоваться ботом? 🦝
    
🎁 Для добавления нового прихода нажмите на кнопку "Добавить приход".

✅ Далее введите имя пользователя.
✅ Выберите нужного пользователя из предложенного списка.
✅ Выберите материал из предложенного списка.
✅ Введите количество материала.
✅ Выберите адрес точки сбора.
✅ Будет автоматически рассчитано количество баллов пользователю. Если вы не согласны с расчетом, нажмите на кнопку "Ввести вручную", иначе на кнопку "ОК". 
Приход успешно сохранен.


🤝 Для добавления партнёра нажмите на кнопку "Добавить партнера".
✅ Введите название компании.
✅ Введите описание компании.
✅ Добавьте изображение компании.
✅ Нажмите "Сохранить"

🔥 Для добавления акции нажмите на кнопку "Добавить акцию".
✅ Выберите партнёра из предложенного списка.
✅ Введите описание акции.
✅ Нажмите "Сохранить"

👕 Для добавления материала нажмите на кнопку "Добавить материал".
✅ Введите название материала. 
✅ Введите введите единицу измерения материала.
✅ Введите количество баллов за единицу материала.
✅ Нажмите "Сохранить".

📍 Для добавления точки нажмите на кнопку "Добавить точку"
✅ Введите адрес точки.
✅ Выберите все материалы, которые принимает данная точка.
✅ Нажмите "Сохранить"

📰 Для добавления новости нажмите на кнопку "Добавить новость".
✅ Введите заголовок новости или нажмите "Далее".
✅ Введите описание новости.
✅ Выберите картинку для новости или нажмите "Далее"
✅ Нажмите "Сохранить"

✏️ Для режима редактирования нажмите на кнопку "Режим редактора".
✅ Выберите категорию, которую вы хотите редактировать. 
✅ Выберите запись из категории, которую вы хотите отредактировать.
✅ Выполняйте действия, описанные для добавления данной категории выше.
✅ Нажмите "Сохранить".

↪️ Для выхода в меню нажмите на кнопку "Меню" или введите "В меню".`;

const menu = [
  [{ text: "🎁 Новый приход", callback_data: "new_things" }],
  [{ text: "🔥 Добавить акцию", callback_data: "new_sale" }],
  [{ text: "👕 Добавить материал", callback_data: "new_material" }],
  [
    {
      text: "📍 Добавить точку",
      callback_data: "new_collection_point",
    },
  ],
  [{ text: "📰 Добавить новость", callback_data: "new_post" }],
  [
    {
      text: "🔧 Редактирование/Просмотр",
      callback_data: "editor_mode",
    },
  ],
];

function start(chatId) {
  bot.sendMessage(
    chatId,
    "Добро пожаловать в Бота-Администратора SMART-obmen!",
    {
      reply_markup: {
        keyboard: [["↪ В меню"], ["📖 Инструкция"]],
      },
    }
  );
  bot.sendMessage(chatId, instructions, {
    reply_markup: {
      inline_keyboard: menu,
    },
  });
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  start(chatId);
});

bot.onText(/В меню/, (msg) => {
  bot.sendMessage(msg.chat.id, "Главное меню", {
    reply_markup: {
      inline_keyboard: menu,
    },
  });
});

bot.onText(/Инструкция/, (msg) => {
  bot.sendMessage(msg.chat.id, instructions);
});

const addNewThing = async () => {};

/**
 * Отправка списка пользователей для выбора пользователя, который принес приход
 * @param {*} msg
 * @returns
 */
const sendUsersListKeyboard = async (msg) => {
  const users = await prisma.user.findMany();
  let buttons = [];

  for (let idx in users) {
    let user = users[idx];
    let role;
    if (user.role == "LOW") {
      role = "🔵";
    } else if (user.role == "MEDIUM") {
      role = "🟢";
    } else if (user.role == "HIGH") {
      role = "🔴";
    } else if (user.role == "ADMIN") {
      role = "ADMIN";
    }

    const text = `${role} ${user.name} ${user.surname}
    (${user.phoneNumber})`;
    const callback_data = `user_select_${user.id}`;
    buttons.push([{ text: text, callback_data: callback_data }]);
  }

  buttons.push([{ text: "❌ Отмена", callback_data: "cancel_new_thing" }]);

  let opts = {
    reply_to_message: msg.message_id,
    reply_markup: JSON.stringify({
      inline_keyboard: buttons,
    }),
  };

  bot.sendMessage(msg.message.chat.id, "👤 Выберите пользователя", opts);

  return users;
};

const sendMaterialListKeyboard = async (msg) => {
  const materials = await prisma.material.findMany();
  let buttons = [];
  for (let idx in materials) {
    let material = materials[idx];
    const text = `${material.name}`;
    const callback_data = `material_select_${material.id}`;
    buttons.push([{ text: text, callback_data: callback_data }]);
  }

  buttons.push([{ text: "❌ Отмена", callback_data: "cancel_new_thing" }]);

  let opts = {
    reply_to_message: msg.message_id,
    reply_markup: JSON.stringify({
      inline_keyboard: buttons,
    }),
  };

  bot.sendMessage(msg.message.chat.id, "👕 Выберите материал", opts);
};

const sentAskQuantity = async (msg) => {
  bot.sendMessage(
    msg.message.chat.id,
    "Укажите колчество принесенного материала:",
    {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Отмена", callback_data: "cancel_new_thing" }],
        ],
      },
    }
  );
};

const sendCollectionPointKeyboard = async (msg) => {
  const collectionPoints = await prisma.collectionPoint.findMany();
  let buttons = [];
  for (let idx in collectionPoints) {
    let point = collectionPoints[idx];
    const text = `${point.address}`;
    const callback_data = `collection_point_select_${point.id}`;
    buttons.push([{ text: text, callback_data: callback_data }]);
  }

  buttons.push([{ text: "❌ Отмена", callback_data: "cancel_new_thing" }]);

  let opts = {
    reply_to_message: msg.message_id,
    reply_markup: JSON.stringify({
      inline_keyboard: buttons,
    }),
  };

  bot.sendMessage(msg.message.chat.id, "👕 Выберите точку сбора", opts);
};

const sendCalculatedPoints = async (msg) => {
  const materialId = Number(
    (await redis.getMaterialOfTheNewBatch(msg.message.chat.id)) || -1
  );
  const materialInfo = await prisma.material.findFirst({
    where: { id: materialId },
  });
  const pointsPerOne = materialInfo.points;
};

bot.on("callback_query", async (msg) => {
  const callback_data = msg.data;
  const chatId = msg.data.message.chat.id;

  // если выбрали пользователя, который что-то принес
  if (callback_data.includes("user_select_")) {
    await redis.setUserWhoBringTheBatch(chatId, callback_data.split("_")[2]);
    await sendMaterialListKeyboard(msg);
  } else if (callback_data.includes("material_select_")) {
    await redis.setMaterialOfTheNewBatch(chatId, callback_data.split("_")[2]);
    await sendCollectionPointKeyboard(msg);
  } else if (callback_data.includes("collection_point_select_")) {
    await redis.setCollectionPointOfTheNewBatch(
      chatId,
      callback_data.split("_")[3]
    );
    await sendCalculatedPoints(msg);
  } else if (callback_data.includes("")) {
  }

  switch (callback_data) {
    case "new_things":
      await sendUsersListKeyboard(msg);
      const material = await selectMaterial(msg);
      break;
    case "new_sale":
      break;
    case "new_material":
      break;
    case "new_collection_point":
      break;
    case "new_post":
      break;
    case "editor_mode":
      break;
    default:
      break;
  }
});
