import {
  DeleteObjectCommand,
  ListObjectsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import dayjs from "dayjs";
import dotenv from "dotenv";
import { IncomingWebhook } from "@slack/webhook";

dotenv.config({
  path: __dirname + "/.env",
});

const requiredEnvs = [
  "BUCKET_KEY",
  "BUCKET_SECRET",
  "BUCKET_REGION",
  "BUCKET_NAME",
  "WEBHOOK",
];

requiredEnvs.forEach((item) => {
  if (typeof process.env[item] === "undefined") {
    console.error(`Brak ustawionej zmiennej ${item}`);
    process.exit(1);
  }
});

const slack = new IncomingWebhook(process.env.WEBHOOK || "");

var s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.BUCKET_KEY || "",
    secretAccessKey: process.env.BUCKET_SECRET || "",
  },
  endpoint: process.env.BUCKET_ENDPOINT,
  region: process.env.BUCKET_REGION,
});

const logger = async (msg: string, isError: boolean = false): Promise<void> => {
  if (isError) {
    await slack.send({
      icon_emoji: ":red_circle:",
      text: msg,
    });
    console.error(msg);

    return;
  }

  await slack.send({
    text: msg,
  });
  console.log(msg);
};

const bucket = process.env.BUCKET_NAME;
const olderThan = parseInt(process.env.OLDER_THAN || "14");
const sevenDaysAgo = dayjs().subtract(olderThan, "d");

const run = async () => {
  await logger(
    `Rozpoczęcie usuwania starych kopii zapasowych z bucketu: ${bucket}`
  );

  let data;
  try {
    data = await s3.send(
      new ListObjectsCommand({
        Bucket: bucket,
      })
    );
  } catch (e) {
    console.log(e);
    await logger("Błąd pobierania danych", true);
  }

  const outdatedFiles = data?.Contents?.filter((item: any) => {
    const day = dayjs(item.LastModified);
    return day.isBefore(sevenDaysAgo);
  });

  if (typeof outdatedFiles === "undefined") {
    await logger("Nie znaleziono żadnych przedawnionych plików");
    return;
  }

  await logger(`Znalezionych plików: ${outdatedFiles?.length}`);

  const deletedFiles: any = [];

  outdatedFiles?.forEach(async (item: any) => {
    const itemToDelete = new DeleteObjectCommand({
      Bucket: bucket,
      Key: item.Key,
    });

    try {
      deletedFiles.push(itemToDelete);
      await s3.send(itemToDelete);
    } catch (e) {
      await logger(`Wystąpił błędy podczas usuwania ${item.Key}: ${e}`, true);
    }
  });

  const deleted = deletedFiles.map((file: any) => file.input.Key);

  if (deleted.length < 1) {
    await logger("Nie ma nic do usunięcia");
  } else {
    await logger(`Usunięte pliki: ${deleted.join(", ")}`);
  }
};

run();
